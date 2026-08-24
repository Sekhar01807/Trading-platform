const request = require("supertest");
const crypto = require("crypto");
const app = require("../../app");
const User = require("../../model/UserModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { PaymentRecordModel } = require("../../model/PaymentRecordModel");
const { TRANSACTION_TYPE } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB, RAZORPAY_SECRET } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: Wallet & Margin Operations", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";
    let createdOrderId = "";

    const emailA = `wallet_test_a_${Date.now()}@pulsetrade.com`;
    const emailB = `wallet_test_b_${Date.now()}@pulsetrade.com`;
    const password = "TradingPassword123!";

    beforeAll(async () => {
        await initTestDB();

        // Create User A
        const resA = await request(app)
            .post("/api/v1/auth/signup")
            .send({ username: "WalletTraderA", email: emailA, password });
        const loginA = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: emailA, password });
        userACookie = loginA.headers["set-cookie"][0].split(";")[0];
        userA = await User.findOne({ email: emailA });

        // Create User B
        const resB = await request(app)
            .post("/api/v1/auth/signup")
            .send({ username: "WalletTraderB", email: emailB, password });
        const loginB = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: emailB, password });
        userBCookie = loginB.headers["set-cookie"][0].split(";")[0];
        userB = await User.findOne({ email: emailB });
    });

    afterAll(async () => {
        const userIds = [userA?._id, userB?._id].filter(Boolean);
        await cleanupTestUsers(userIds);
        await teardownTestDB();
    });

    test("Deposit ₹100,000 into User A wallet", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/user/funds")
            .set("Cookie", userACookie)
            .send({ amount: 100000, action: "ADD" });

        expect(res.statusCode).toBe(200);
        expect(res.body.totalAddedFunds).toBe(100000);

        const tx = await TransactionModel.findOne({ userId: userA._id, type: TRANSACTION_TYPE.DEPOSIT });
        expect(tx).not.toBeNull();
        expect(tx.balanceAfter).toBe(100000);
    });

    test("GET /api/v1/wallet/user/funds should reflect ₹100,000 available cash", async () => {
        const res = await request(app)
            .get("/api/v1/wallet/user/funds")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.availableCash).toBe(100000);
        expect(res.body.totalAddedFunds).toBe(100000);
    });

    test("Withdrawal exceeding available balance should be rejected", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/user/funds")
            .set("Cookie", userACookie)
            .send({ amount: 999999, action: "WITHDRAW" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("exceeds available cash");
    });

    test("Valid withdrawal should atomically deduct funds and write ledger", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/user/funds")
            .set("Cookie", userACookie)
            .send({ amount: 10000, action: "WITHDRAW" });

        expect(res.statusCode).toBe(200);
        expect(res.body.totalAddedFunds).toBe(90000);

        const tx = await TransactionModel.findOne({ userId: userA._id, type: TRANSACTION_TYPE.WITHDRAWAL });
        expect(tx).not.toBeNull();
        expect(tx.amount).toBe(10000);
        expect(tx.balanceAfter).toBe(90000);
    });

    test("POST /api/v1/wallet/create-razorpay-order should store pending order server-side", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/create-razorpay-order")
            .set("Cookie", userACookie)
            .send({ amount: 25000 });

        expect(res.statusCode).toBe(200);
        expect(res.body.order_id).toBeDefined();
        createdOrderId = res.body.order_id;

        const pending = await PaymentRecordModel.findOne({ razorpay_order_id: createdOrderId });
        expect(pending).not.toBeNull();
        expect(pending.amount).toBe(25000);
        expect(pending.status).toBe("PENDING");
        expect(pending.userId.toString()).toBe(userA._id.toString());
    });

    test("Verification should REJECT when NO server-created pending order exists", async () => {
        const arbitraryOrderId = `order_fake_${Date.now()}`;
        const paymentId = `pay_fake_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${arbitraryOrderId}|${paymentId}`)
            .digest("hex");

        const res = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userACookie)
            .send({
                amount: 5000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: arbitraryOrderId,
                razorpay_signature: signature
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("No pending order found");
    });

    test("User B should be REJECTED if trying to verify User A's pending order", async () => {
        const paymentId = `pay_cross_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${createdOrderId}|${paymentId}`)
            .digest("hex");

        const res = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userBCookie)
            .send({
                amount: 25000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: createdOrderId,
                razorpay_signature: signature
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("No pending order found");
    });

    test("Verification should REJECT if amount is mismatched with server order", async () => {
        const paymentId = `pay_mismatch_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${createdOrderId}|${paymentId}`)
            .digest("hex");

        const res = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userACookie)
            .send({
                amount: 99999,
                razorpay_payment_id: paymentId,
                razorpay_order_id: createdOrderId,
                razorpay_signature: signature
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("Payment amount mismatch");
    });

    test("Verification should REJECT on tampered HMAC-SHA256 signature", async () => {
        const res = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userACookie)
            .send({
                amount: 25000,
                razorpay_payment_id: `pay_tamper_${Date.now()}`,
                razorpay_order_id: createdOrderId,
                razorpay_signature: "tampered_fake_signature"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("signature verification failed");
    });

    test("Valid signature credits funds atomically and allows idempotent replay", async () => {
        const paymentId = `pay_valid_${Date.now()}`;
        const signature = crypto
            .createHmac("sha256", RAZORPAY_SECRET)
            .update(`${createdOrderId}|${paymentId}`)
            .digest("hex");

        const userBefore = await User.findById(userA._id);
        const balanceBefore = userBefore.funds;

        // Initial verification
        const res1 = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userACookie)
            .send({
                amount: 25000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: createdOrderId,
                razorpay_signature: signature
            });

        expect(res1.statusCode).toBe(200);
        expect(res1.body.status).toBe(true);
        expect(res1.body.totalAddedFunds).toBe(balanceBefore + 25000);

        // Record status must be SUCCESS
        const updatedRecord = await PaymentRecordModel.findOne({ razorpay_order_id: createdOrderId });
        expect(updatedRecord.status).toBe("SUCCESS");
        expect(updatedRecord.razorpay_payment_id).toBe(paymentId);

        // Transaction ledger created
        const tx = await TransactionModel.findOne({ referenceId: paymentId });
        expect(tx).not.toBeNull();
        expect(tx.amount).toBe(25000);

        // Idempotent replay
        const res2 = await request(app)
            .post("/api/v1/wallet/verify-razorpay-payment")
            .set("Cookie", userACookie)
            .send({
                amount: 25000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: createdOrderId,
                razorpay_signature: signature
            });

        expect(res2.statusCode).toBe(200);
        expect(res2.body.idempotentReplay).toBe(true);

        const userAfterReplay = await User.findById(userA._id);
        expect(userAfterReplay.funds).toBe(balanceBefore + 25000);
    });

    test("GET /api/v1/wallet/user/transactions with pagination", async () => {
        const res = await request(app)
            .get("/api/v1/wallet/user/transactions?page=1&limit=3")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe(true);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.limit).toBe(3);
        expect(res.body.data.length).toBeLessThanOrEqual(3);
    });
});
