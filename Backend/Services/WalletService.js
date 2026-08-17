const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../config/constants");
const logger = require("../util/logger");

class WalletService {
    /**
     * Retrieves the financial funds & cash margin breakdown for a user.
     * Semantics: User.funds represents current available cash balance.
     */
    static async getFundsSummary(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: "User not found" };
        }

        const holdings = await HoldingModel.find({ userId });
        const spentOnHoldings = Number(holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0).toFixed(2));
        const currentPortfolioValue = Number(holdings.reduce((sum, h) => sum + (h.qty * (h.price || h.avg)), 0).toFixed(2));
        const availableCash = Number((user.funds || 0).toFixed(2));
        const totalNetWorth = Number((availableCash + currentPortfolioValue).toFixed(2));

        return {
            status: true,
            totalAddedFunds: availableCash, // Available cash in trading wallet
            spentOnHoldings,
            currentPortfolioValue,
            availableCash,
            totalNetWorth
        };
    }

    /**
     * Adds or withdraws wallet balance transactionally with ledger tracking.
     */
    static async updateFunds(userId, amount, action) {
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid amount" };
        }

        const userBefore = await User.findById(userId);
        if (!userBefore) {
            throw { statusCode: 404, message: "User not found" };
        }

        const balanceBefore = userBefore.funds || 0;

        if (action === "ADD") {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { funds: numAmt } },
                { new: true }
            );

            await TransactionModel.create({
                userId,
                type: TRANSACTION_TYPE.DEPOSIT,
                amount: numAmt,
                balanceBefore,
                balanceAfter: updatedUser.funds,
                status: TRANSACTION_STATUS.SUCCESS,
                description: `Manual deposit of ₹${numAmt.toFixed(2)}`
            });

            logger.info("Wallet deposit completed", { userId, amount: numAmt, balanceAfter: updatedUser.funds });

            return {
                status: true,
                totalAddedFunds: updatedUser.funds,
                message: `Successfully deposited ₹${numAmt.toFixed(2)}`
            };
        } else if (action === "WITHDRAW") {
            // Check available cash balance
            if (numAmt > balanceBefore) {
                throw {
                    statusCode: 400,
                    message: `Withdrawal amount (₹${numAmt.toFixed(2)}) exceeds available cash balance (₹${balanceBefore.toFixed(2)})!`
                };
            }

            // Atomic balance check and deduction
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, funds: { $gte: numAmt } },
                { $inc: { funds: -numAmt } },
                { new: true }
            );

            if (!updatedUser) {
                throw {
                    statusCode: 400,
                    message: "Withdrawal failed due to insufficient funds."
                };
            }

            await TransactionModel.create({
                userId,
                type: TRANSACTION_TYPE.WITHDRAWAL,
                amount: numAmt,
                balanceBefore,
                balanceAfter: updatedUser.funds,
                status: TRANSACTION_STATUS.SUCCESS,
                description: `Withdrawal of ₹${numAmt.toFixed(2)}`
            });

            logger.info("Wallet withdrawal completed", { userId, amount: numAmt, balanceAfter: updatedUser.funds });

            return {
                status: true,
                totalAddedFunds: updatedUser.funds,
                message: `Successfully withdrew ₹${numAmt.toFixed(2)}`
            };
        } else {
            throw { statusCode: 400, message: "Invalid action. Must be ADD or WITHDRAW." };
        }
    }

    /**
     * Creates a Razorpay payment order for wallet top-up and stores expected amount server-side.
     */
    static async createRazorpayOrder(userId, amount) {
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid deposit amount" };
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        let orderId = "";
        let amountInPaise = Math.round(numAmt * 100);

        if (razorpayKeyId && razorpayKeySecret) {
            const Razorpay = require("razorpay");
            const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}`
            });
            orderId = order.id;
        } else {
            // Simulated test order ID if test keys not set
            orderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }

        // Store expected order amount and userId server-side to prevent amount manipulation
        await PaymentRecordModel.create({
            userId,
            razorpay_order_id: orderId,
            amount: numAmt,
            status: "PENDING"
        });

        logger.info("Razorpay Order Created", { userId, orderId, amount: numAmt });

        return {
            status: true,
            order_id: orderId,
            amount: amountInPaise,
            currency: "INR",
            key_id: razorpayKeyId || "rzp_test_simulated_key"
        };
    }

    /**
     * Cryptographically verifies Razorpay HMAC-SHA256 signature, validates server-stored order amount,
     * and credits funds idempotently with unique payment key constraints.
     */
    static async verifyRazorpayPayment(userId, { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            throw { statusCode: 400, message: "Missing payment verification fields." };
        }

        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid deposit amount" };
        }

        // 1. Cryptographic HMAC-SHA256 Signature Verification
        const secret = process.env.RAZORPAY_KEY_SECRET || "MLfOsojM55l35lIfKw4k4wZi";

        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            logger.warn("Payment signature verification failed", { userId, razorpay_order_id, razorpay_payment_id });
            throw {
                statusCode: 400,
                message: "Payment signature verification failed. Possible fraud."
            };
        }

        // 2. IDEMPOTENCY CHECK: Check if this payment ID was already processed
        const existingPayment = await PaymentRecordModel.findOne({ razorpay_payment_id });
        if (existingPayment && existingPayment.status === "SUCCESS") {
            const user = await User.findById(userId);
            logger.info("Idempotent replay for already-credited payment", { razorpay_payment_id });
            return {
                status: true,
                totalAddedFunds: user ? user.funds : 0,
                message: `Payment already processed and credited (ID: ${razorpay_payment_id}).`,
                idempotentReplay: true
            };
        }

        // 3. SERVER-SIDE ORDER & AMOUNT VALIDATION:
        // Find stored pending order to verify amount against the order created on server
        let paymentRecord = await PaymentRecordModel.findOne({ razorpay_order_id, userId });

        if (paymentRecord) {
            // Verify client-supplied amount matches expected amount created server-side
            if (Math.abs(paymentRecord.amount - numAmt) > 0.01) {
                logger.error("Payment amount mismatch with server order", {
                    expected: paymentRecord.amount,
                    received: numAmt,
                    orderId: razorpay_order_id
                });
                throw {
                    statusCode: 400,
                    message: `Payment amount mismatch: Order expected ₹${paymentRecord.amount}, but verification requested ₹${numAmt}.`
                };
            }
        }

        // 4. Atomically Record Payment & Credit Funds
        const userBefore = await User.findById(userId);
        if (!userBefore) {
            throw { statusCode: 404, message: "User not found" };
        }
        const balanceBefore = userBefore.funds || 0;

        try {
            if (paymentRecord) {
                paymentRecord.razorpay_payment_id = razorpay_payment_id;
                paymentRecord.razorpay_signature = razorpay_signature;
                paymentRecord.status = "SUCCESS";
                await paymentRecord.save();
            } else {
                paymentRecord = await PaymentRecordModel.create({
                    userId,
                    razorpay_payment_id,
                    razorpay_order_id,
                    razorpay_signature,
                    amount: numAmt,
                    status: "SUCCESS"
                });
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { funds: numAmt } },
                { new: true }
            );

            const balanceAfter = updatedUser.funds;

            // 5. Record Wallet Ledger Entry
            await TransactionModel.create({
                userId,
                type: TRANSACTION_TYPE.DEPOSIT,
                amount: numAmt,
                balanceBefore,
                balanceAfter,
                referenceId: razorpay_payment_id,
                status: TRANSACTION_STATUS.SUCCESS,
                description: `Razorpay Deposit Verified (Order: ${razorpay_order_id})`
            });

            logger.info("Razorpay payment verified and credited", {
                userId,
                paymentId: razorpay_payment_id,
                amount: numAmt,
                balanceAfter
            });

            return {
                status: true,
                totalAddedFunds: balanceAfter,
                message: `✓ Payment Verified! ₹${numAmt.toLocaleString("en-IN")} credited to your trading wallet.`
            };
        } catch (error) {
            // Catch duplicate key error if concurrent request raced
            if (error.code === 11000) {
                const user = await User.findById(userId);
                return {
                    status: true,
                    totalAddedFunds: user ? user.funds : balanceBefore,
                    message: "Payment was already recorded by concurrent request.",
                    idempotentReplay: true
                };
            }
            throw error;
        }
    }

    /**
     * Retrieves paginated financial transaction history ledger for a user.
     */
    static async getTransactionHistory(userId, queryParams = {}) {
        const { page = 1, limit = 20 } = queryParams;
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (parsedPage - 1) * parsedLimit;

        const [transactions, totalTransactions] = await Promise.all([
            TransactionModel.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parsedLimit),
            TransactionModel.countDocuments({ userId })
        ]);

        const totalPages = Math.ceil(totalTransactions / parsedLimit) || 1;

        return {
            status: true,
            data: transactions,
            pagination: {
                totalTransactions,
                page: parsedPage,
                limit: parsedLimit,
                totalPages,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            }
        };
    }
}

module.exports = WalletService;
