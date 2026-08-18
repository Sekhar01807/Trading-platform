const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../config/constants");
const { runInTransaction } = require("../util/transactionHelper");
const logger = require("../util/logger");

class WalletService {
    /**
     * Retrieves the financial funds & cash margin breakdown for a user.
     * User.funds represents current available cash balance.
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
     * Uses atomic conditional updates and MongoDB session transactions.
     */
    static async updateFunds(userId, amount, action) {
        const numAmt = Number(parseFloat(amount).toFixed(2));
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid amount. Must be greater than zero." };
        }

        const cleanAction = (action || "").trim().toUpperCase();

        if (cleanAction === "ADD") {
            return await runInTransaction(async (session) => {
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { $inc: { funds: numAmt } },
                    { returnDocument: "after", session }
                );

                if (!updatedUser) {
                    throw { statusCode: 404, message: "User not found" };
                }

                const balanceAfter = Number(updatedUser.funds.toFixed(2));
                const balanceBefore = Number((balanceAfter - numAmt).toFixed(2));

                await TransactionModel.create(
                    [{
                        userId,
                        type: TRANSACTION_TYPE.DEPOSIT,
                        amount: numAmt,
                        balanceBefore,
                        balanceAfter,
                        status: TRANSACTION_STATUS.SUCCESS,
                        description: `Manual deposit of ₹${numAmt.toFixed(2)}`
                    }],
                    { session }
                );

                logger.info("Wallet deposit completed via transaction", { userId, amount: numAmt, balanceAfter });

                return {
                    status: true,
                    totalAddedFunds: balanceAfter,
                    message: `Successfully deposited ₹${numAmt.toFixed(2)}`
                };
            });
        } else if (cleanAction === "WITHDRAW") {
            // Check available balance before starting
            const userBefore = await User.findById(userId);
            if (!userBefore) {
                throw { statusCode: 404, message: "User not found" };
            }
            const currentFunds = Number((userBefore.funds || 0).toFixed(2));

            if (numAmt > currentFunds) {
                throw {
                    statusCode: 400,
                    message: `Withdrawal amount (₹${numAmt.toFixed(2)}) exceeds available cash balance (₹${currentFunds.toFixed(2)})!`
                };
            }

            return await runInTransaction(async (session) => {
                // Concurrency-safe atomic deduction: guarantees funds >= numAmt at write time
                const updatedUser = await User.findOneAndUpdate(
                    { _id: userId, funds: { $gte: numAmt } },
                    { $inc: { funds: -numAmt } },
                    { returnDocument: "after", session }
                );

                if (!updatedUser) {
                    const userCheck = await User.findById(userId);
                    const available = userCheck ? Number((userCheck.funds || 0).toFixed(2)) : 0;
                    throw {
                        statusCode: 400,
                        message: `Withdrawal failed: Insufficient cash balance (Available: ₹${available.toFixed(2)}, Requested: ₹${numAmt.toFixed(2)}).`
                    };
                }

                const balanceAfter = Number(updatedUser.funds.toFixed(2));
                const balanceBefore = Number((balanceAfter + numAmt).toFixed(2));

                await TransactionModel.create(
                    [{
                        userId,
                        type: TRANSACTION_TYPE.WITHDRAWAL,
                        amount: numAmt,
                        balanceBefore,
                        balanceAfter,
                        status: TRANSACTION_STATUS.SUCCESS,
                        description: `Withdrawal of ₹${numAmt.toFixed(2)}`
                    }],
                    { session }
                );

                logger.info("Wallet withdrawal completed via transaction", { userId, amount: numAmt, balanceAfter });

                return {
                    status: true,
                    totalAddedFunds: balanceAfter,
                    message: `Successfully withdrew ₹${numAmt.toFixed(2)}`
                };
            });
        } else {
            throw { statusCode: 400, message: "Invalid action. Must be ADD or WITHDRAW." };
        }
    }

    /**
     * Creates a Razorpay payment order for wallet top-up and stores expected amount server-side.
     * Enforces that verification MUST match this server-created pending order.
     */
    static async createRazorpayOrder(userId, amount) {
        const numAmt = Number(parseFloat(amount).toFixed(2));
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid deposit amount" };
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        // In production, missing payment configuration must strictly fail closed
        if (process.env.NODE_ENV === "production" && (!razorpayKeyId || !razorpayKeySecret)) {
            logger.error("Razorpay order creation failed: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in production.");
            throw {
                statusCode: 500,
                message: "Payment gateway configuration error: Razorpay keys are not configured in production."
            };
        }

        let orderId = "";
        let amountInPaise = Math.round(numAmt * 100);

        if (razorpayKeyId && razorpayKeySecret && !razorpayKeyId.startsWith("rzp_test_simulated") && process.env.NODE_ENV !== "test") {
            const Razorpay = require("razorpay");
            const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

            const order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}`
            });
            orderId = order.id;
        } else {
            // Simulated development/test order ID only in non-production environments
            orderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }

        // Store expected order amount and userId server-side to enforce pending verification
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
     * Cryptographically verifies Razorpay HMAC-SHA256 signature, strictly validates
     * that a server-created PENDING record exists for this user and order,
     * and credits funds + writes ledger atomically within a single MongoDB session transaction.
     */
    static async verifyRazorpayPayment(userId, { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature }) {
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            throw { statusCode: 400, message: "Missing payment verification fields." };
        }

        const numAmt = Number(parseFloat(amount).toFixed(2));
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid deposit amount" };
        }

        // 1. Cryptographic HMAC-SHA256 Signature Verification
        // Strictly pull secret from environment configuration
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            logger.error("Payment verification failed: RAZORPAY_KEY_SECRET environment variable is not configured.");
            throw {
                statusCode: 500,
                message: "Payment gateway configuration error. Please configure RAZORPAY_KEY_SECRET."
            };
        }

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
                totalAddedFunds: user ? Number(user.funds.toFixed(2)) : 0,
                message: `Payment already processed and credited (ID: ${razorpay_payment_id}).`,
                idempotentReplay: true
            };
        }

        // 3. STRICT SERVER-SIDE PENDING RECORD VALIDATION:
        // A server-created PENDING record MUST exist for this order and user.
        // Arbitrary verification requests without a prior server order are rejected immediately.
        const paymentRecord = await PaymentRecordModel.findOne({ razorpay_order_id, userId });

        if (!paymentRecord) {
            logger.error("Payment verification rejected: No server-created pending order found", {
                userId,
                orderId: razorpay_order_id
            });
            throw {
                statusCode: 400,
                message: `Invalid payment verification: No pending order found on server for ${razorpay_order_id}. Verification rejected.`
            };
        }

        if (paymentRecord.status === "SUCCESS") {
            const user = await User.findById(userId);
            return {
                status: true,
                totalAddedFunds: user ? Number(user.funds.toFixed(2)) : 0,
                message: `Payment already processed and credited.`,
                idempotentReplay: true
            };
        }

        if (paymentRecord.status !== "PENDING") {
            throw {
                statusCode: 400,
                message: `Payment verification rejected: Order is in invalid state (${paymentRecord.status}).`
            };
        }

        // Verify client-supplied amount matches expected amount created server-side
        if (Math.abs(paymentRecord.amount - numAmt) > 0.01) {
            logger.error("Payment amount mismatch with server order", {
                expected: paymentRecord.amount,
                received: numAmt,
                orderId: razorpay_order_id
            });
            throw {
                statusCode: 400,
                message: `Payment amount mismatch: Order expected ₹${paymentRecord.amount.toFixed(2)}, but verification requested ₹${numAmt.toFixed(2)}.`
            };
        }

        // 4. ATOMIC TRANSACTION: Mark Payment SUCCESS + Increment User Funds + Write Ledger Entry
        try {
            return await runInTransaction(async (session) => {
                // A. Update PaymentRecord status
                await PaymentRecordModel.findByIdAndUpdate(
                    paymentRecord._id,
                    {
                        razorpay_payment_id,
                        razorpay_signature,
                        status: "SUCCESS"
                    },
                    { session }
                );

                // B. Credit funds to user wallet
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { $inc: { funds: numAmt } },
                    { returnDocument: "after", session }
                );

                if (!updatedUser) {
                    throw { statusCode: 404, message: "User not found" };
                }

                const balanceAfter = Number(updatedUser.funds.toFixed(2));
                const balanceBefore = Number((balanceAfter - numAmt).toFixed(2));

                // C. Write transaction ledger entry
                await TransactionModel.create(
                    [{
                        userId,
                        type: TRANSACTION_TYPE.DEPOSIT,
                        amount: numAmt,
                        balanceBefore,
                        balanceAfter,
                        referenceId: razorpay_payment_id,
                        status: TRANSACTION_STATUS.SUCCESS,
                        description: `Razorpay Deposit Verified (Order: ${razorpay_order_id})`
                    }],
                    { session }
                );

                logger.info("Razorpay payment verified and credited via transaction", {
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
            });
        } catch (error) {
            // Catch duplicate key error if concurrent request raced
            if (error.code === 11000) {
                const user = await User.findById(userId);
                return {
                    status: true,
                    totalAddedFunds: user ? Number(user.funds.toFixed(2)) : 0,
                    message: "Payment was already recorded by concurrent request.",
                    idempotentReplay: true
                };
            }
            throw error;
        }
    }

    /**
     * Retrieves paginated financial transaction history ledger for a user.
     * Strictly scopes queries to req.userId.
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
