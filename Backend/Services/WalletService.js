const crypto = require("crypto");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../config/constants");

class WalletService {
    /**
     * Retrieves the financial funds & cash margin breakdown for a user.
     */
    static async getFundsSummary(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: "User not found" };
        }

        const holdings = await HoldingModel.find({ userId });
        const spentOnHoldings = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
        const currentPortfolioValue = holdings.reduce((sum, h) => sum + (h.qty * (h.price || h.avg)), 0);
        const totalAddedFunds = user.funds || 0;
        const availableCash = Math.max(0, totalAddedFunds - spentOnHoldings);

        return {
            status: true,
            totalAddedFunds,
            spentOnHoldings: Number(spentOnHoldings.toFixed(2)),
            currentPortfolioValue: Number(currentPortfolioValue.toFixed(2)),
            availableCash: Number(availableCash.toFixed(2))
        };
    }

    /**
     * Atomically adds or withdraws wallet balance with ledger tracking.
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

            return {
                status: true,
                totalAddedFunds: updatedUser.funds,
                message: `Successfully deposited ₹${numAmt.toFixed(2)}`
            };
        } else if (action === "WITHDRAW") {
            const holdings = await HoldingModel.find({ userId });
            const spentOnHoldings = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
            const availableCash = Math.max(0, balanceBefore - spentOnHoldings);

            if (numAmt > availableCash) {
                throw {
                    statusCode: 400,
                    message: "Withdrawal amount exceeds available cash!"
                };
            }

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
     * Creates a Razorpay payment order for wallet top-up.
     */
    static async createRazorpayOrder(userId, amount) {
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            throw { statusCode: 400, message: "Invalid deposit amount" };
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            throw { statusCode: 500, message: "Razorpay credentials not configured." };
        }

        const amountInPaise = Math.round(numAmt * 100);
        if (amountInPaise < 100) {
            throw { statusCode: 400, message: "Minimum deposit is ₹1" };
        }

        const Razorpay = require("razorpay");
        const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now()}`
        });

        return {
            status: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: razorpayKeyId
        };
    }

    /**
     * Cryptographically verifies Razorpay payment HMAC-SHA256 signature with IDEMPOTENCY.
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
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            throw { statusCode: 500, message: "Payment secret key not configured." };
        }

        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            throw {
                statusCode: 400,
                message: "Payment signature verification failed. Possible fraud."
            };
        }

        // 2. IDEMPOTENCY CHECK: Prevent replay attacks and duplicate crediting
        const existingPayment = await PaymentRecordModel.findOne({ razorpay_payment_id });
        if (existingPayment) {
            const user = await User.findById(userId);
            return {
                status: true,
                totalAddedFunds: user ? user.funds : 0,
                message: `Payment already processed and credited (ID: ${razorpay_payment_id}).`,
                idempotentReplay: true
            };
        }

        // 3. Atomically Record Payment & Credit Funds
        const userBefore = await User.findById(userId);
        if (!userBefore) {
            throw { statusCode: 404, message: "User not found" };
        }
        const balanceBefore = userBefore.funds || 0;

        await PaymentRecordModel.create({
            userId,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            amount: numAmt,
            status: "SUCCESS"
        });

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { funds: numAmt } },
            { new: true }
        );

        const balanceAfter = updatedUser.funds;

        // 4. Record Wallet Ledger Entry
        await TransactionModel.create({
            userId,
            type: TRANSACTION_TYPE.DEPOSIT,
            amount: numAmt,
            balanceBefore,
            balanceAfter,
            referenceId: razorpay_payment_id,
            status: TRANSACTION_STATUS.SUCCESS,
            description: `Razorpay Test Mode Deposit (Order: ${razorpay_order_id})`
        });

        console.log(`[Razorpay] ✓ Payment verified: ${razorpay_payment_id} | ₹${numAmt} credited to user ${userId}`);

        return {
            status: true,
            totalAddedFunds: balanceAfter,
            message: `✓ Payment Verified! ₹${numAmt.toLocaleString("en-IN")} credited to your trading wallet.`
        };
    }

    /**
     * Retrieves financial transaction history ledger for a user.
     */
    static async getTransactionHistory(userId) {
        return await TransactionModel.find({ userId }).sort({ createdAt: -1 });
    }
}

module.exports = WalletService;
