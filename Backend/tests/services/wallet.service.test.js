const crypto = require("crypto");
const WalletService = require("../../Services/WalletService");
const User = require("../../model/UserModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { PaymentRecordModel } = require("../../model/PaymentRecordModel");
const { TRANSACTION_TYPE } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB, RAZORPAY_SECRET } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("Domain Service: WalletService & Payment Ledgers", () => {
    let testUser = null;
    let testUser2 = null;
    let testOrderId = "";

    const email1 = `wallet_svc_1_${Date.now()}@pulsetrade.com`;
    const email2 = `wallet_svc_2_${Date.now()}@pulsetrade.com`;

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /wallet_svc_.*@pulsetrade\.com/i });

        testUser = await User.create({
            username: "WalletSvcTrader1",
            email: email1,
            password: "HashedPassword123!",
            funds: 50000
        });

        testUser2 = await User.create({
            username: "WalletSvcTrader2",
            email: email2,
            password: "HashedPassword123!",
            funds: 10000
        });
    });

    afterAll(async () => {
        const userIds = [testUser?._id, testUser2?._id].filter(Boolean);
        await cleanupTestUsers(userIds);
        await teardownTestDB();
    });

    test("getFundsSummary should calculate portfolio values accurately", async () => {
        const summary = await WalletService.getFundsSummary(testUser._id);
        expect(summary.status).toBe(true);
        expect(summary.availableCash).toBeGreaterThan(0);
        expect(summary.spentOnHoldings).toBeGreaterThanOrEqual(0);
        expect(summary.totalNetWorth).toBe(Number((summary.availableCash + summary.currentPortfolioValue).toFixed(2)));
    });

    test("updateFunds with invalid amount or action should reject with 400", async () => {
        await expect(WalletService.updateFunds(testUser._id, -500, "ADD"))
            .rejects.toMatchObject({ statusCode: 400 });

        await expect(WalletService.updateFunds(testUser._id, 0, "ADD"))
            .rejects.toMatchObject({ statusCode: 400 });

        await expect(WalletService.updateFunds(testUser._id, 500, "UNKNOWN_ACTION"))
            .rejects.toMatchObject({ statusCode: 400 });
    });

    test("updateFunds ADD should increment funds and write DEPOSIT ledger atomically", async () => {
        const userBefore = await User.findById(testUser._id);
        const balanceBefore = userBefore.funds;

        const res = await WalletService.updateFunds(testUser._id, 25000, "ADD");
        expect(res.status).toBe(true);
        expect(res.totalAddedFunds).toBe(balanceBefore + 25000);

        const tx = await TransactionModel.findOne({
            userId: testUser._id,
            type: TRANSACTION_TYPE.DEPOSIT,
            amount: 25000
        });
        expect(tx).not.toBeNull();
        expect(tx.balanceAfter).toBe(balanceBefore + 25000);
    });

    test("updateFunds WITHDRAW exceeding balance should reject with 400", async () => {
        const user = await User.findById(testUser._id);
        const currentFunds = user.funds;

        await expect(WalletService.updateFunds(testUser._id, currentFunds + 100000, "WITHDRAW"))
            .rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("exceeds available cash balance")
            });
    });

    test("updateFunds WITHDRAW valid amount should decrement funds and write WITHDRAWAL ledger", async () => {
        const userBefore = await User.findById(testUser._id);
        const balanceBefore = userBefore.funds;

        const res = await WalletService.updateFunds(testUser._id, 5000, "WITHDRAW");
        expect(res.status).toBe(true);
        expect(res.totalAddedFunds).toBe(balanceBefore - 5000);

        const tx = await TransactionModel.findOne({
            userId: testUser._id,
            type: TRANSACTION_TYPE.WITHDRAWAL,
            amount: 5000
        });
        expect(tx).not.toBeNull();
        expect(tx.balanceAfter).toBe(balanceBefore - 5000);
    });

    test("createRazorpayOrder should store PENDING payment record server-side", async () => {
        const result = await WalletService.createRazorpayOrder(testUser._id, 15000);
        expect(result.status).toBe(true);
        expect(result.order_id).toBeDefined();
        testOrderId = result.order_id;

        const pending = await PaymentRecordModel.findOne({ razorpay_order_id: testOrderId });
        expect(pending).not.toBeNull();
        expect(pending.amount).toBe(15000);
        expect(pending.status).toBe("PENDING");
        expect(pending.userId.toString()).toBe(testUser._id.toString());
    });

    test("verifyRazorpayPayment should reject missing verification parameters", async () => {
        await expect(WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 15000,
            razorpay_payment_id: "pay_123"
        })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("verifyRazorpayPayment should reject forged/tampered HMAC signature (constant-time check)", async () => {
        await expect(WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 15000,
            razorpay_payment_id: `pay_tamper_${Date.now()}`,
            razorpay_order_id: testOrderId,
            razorpay_signature: "invalid_forged_hmac_hex_signature"
        })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("Payment signature verification failed")
        });
    });

    test("verifyRazorpayPayment should reject when no server pending order exists", async () => {
        const fakeOrderId = `order_unrecorded_${Date.now()}`;
        const fakePaymentId = `pay_unrecorded_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${fakeOrderId}|${fakePaymentId}`)
            .digest("hex");

        await expect(WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 15000,
            razorpay_payment_id: fakePaymentId,
            razorpay_order_id: fakeOrderId,
            razorpay_signature: signature
        })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("No pending order found")
        });
    });

    test("verifyRazorpayPayment should reject amount mismatch with server order", async () => {
        const paymentId = `pay_mismatch_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${testOrderId}|${paymentId}`)
            .digest("hex");

        await expect(WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 99999,
            razorpay_payment_id: paymentId,
            razorpay_order_id: testOrderId,
            razorpay_signature: signature
        })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("Payment amount mismatch")
        });
    });

    test("verifyRazorpayPayment should reject cross-user order verification attempt", async () => {
        const paymentId = `pay_cross_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${testOrderId}|${paymentId}`)
            .digest("hex");

        await expect(WalletService.verifyRazorpayPayment(testUser2._id, {
            amount: 15000,
            razorpay_payment_id: paymentId,
            razorpay_order_id: testOrderId,
            razorpay_signature: signature
        })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("No pending order found")
        });
    });

    test("verifyRazorpayPayment with valid HMAC should credit wallet and support idempotent replay", async () => {
        const paymentId = `pay_valid_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${testOrderId}|${paymentId}`)
            .digest("hex");

        const userBefore = await User.findById(testUser._id);
        const balanceBefore = userBefore.funds;

        // Initial credit
        const res1 = await WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 15000,
            razorpay_payment_id: paymentId,
            razorpay_order_id: testOrderId,
            razorpay_signature: signature
        });

        expect(res1.status).toBe(true);
        expect(res1.totalAddedFunds).toBe(balanceBefore + 15000);

        const updatedPending = await PaymentRecordModel.findOne({ razorpay_order_id: testOrderId });
        expect(updatedPending.status).toBe("SUCCESS");

        // Idempotent replay
        const res2 = await WalletService.verifyRazorpayPayment(testUser._id, {
            amount: 15000,
            razorpay_payment_id: paymentId,
            razorpay_order_id: testOrderId,
            razorpay_signature: signature
        });

        expect(res2.status).toBe(true);
        expect(res2.idempotentReplay).toBe(true);

        const userAfterReplay = await User.findById(testUser._id);
        expect(userAfterReplay.funds).toBe(balanceBefore + 15000);
    });
});
