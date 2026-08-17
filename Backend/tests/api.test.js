const request = require("supertest");
const crypto = require("crypto");

const app = require("../app");
const { connectDB, closeDB } = require("../config/db");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { OrderModel } = require("../model/OrderModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const { ORDER_STATUS, ORDER_MODE, TRANSACTION_TYPE } = require("../config/constants");

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "MLfOsojM55l35lIfKw4k4wZi";

describe("PulseTrade Paper-Trading Backend Test Suite", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";

    const emailA = `test_trader_a_${Date.now()}@pulsetrade.com`;
    const emailB = `test_trader_b_${Date.now()}@pulsetrade.com`;
    const rawPassword = "StrongTradingPassword123!";

    beforeAll(async () => {
        await connectDB();
        await User.deleteMany({ email: /test_trader_.*@pulsetrade\.com/i });
    });

    afterAll(async () => {
        if (userA) {
            await User.deleteMany({ _id: { $in: [userA._id, userB?._id].filter(Boolean) } });
            await HoldingModel.deleteMany({ userId: { $in: [userA._id, userB?._id].filter(Boolean) } });
            await PositionModel.deleteMany({ userId: { $in: [userA._id, userB?._id].filter(Boolean) } });
            await OrderModel.deleteMany({ userId: { $in: [userA._id, userB?._id].filter(Boolean) } });
            await TransactionModel.deleteMany({ userId: { $in: [userA._id, userB?._id].filter(Boolean) } });
            await PaymentRecordModel.deleteMany({ userId: { $in: [userA._id, userB?._id].filter(Boolean) } });
        }
        await closeDB();
    });

    // ---------------------------------------------------------
    // 1. Health, Diagnostics, Swagger & Observability
    // ---------------------------------------------------------
    describe("1. System Health, Diagnostics & Observability", () => {
        test("GET /health should return 200 with diagnostics", async () => {
            const res = await request(app).get("/health");
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("healthy");
            expect(res.body.database.status).toBe("connected");
            expect(res.body.memory.heapUsedMB).toBeGreaterThan(0);
        });

        test("GET /api/v1/health should mirror health endpoint", async () => {
            const res = await request(app).get("/api/v1/health");
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("healthy");
        });

        test("GET /api-docs should serve Swagger UI", async () => {
            const res = await request(app).get("/api-docs");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("SwaggerUIBundle");
        });

        test("Request logger should attach X-Request-Id header", async () => {
            const res = await request(app).get("/health");
            expect(res.headers["x-request-id"]).toBeDefined();
        });
    });

    // ---------------------------------------------------------
    // 2. Authentication, Validation & Security
    // ---------------------------------------------------------
    describe("2. Authentication, Centralized Validation & Security", () => {
        test("Signup should reject weak password, invalid email, or short username", async () => {
            const resShortPass = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderA", email: emailA, password: "123" });
            expect(resShortPass.statusCode).toBe(400);

            const resWeakPass = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderA", email: emailA, password: "passwordonly" });
            expect(resWeakPass.statusCode).toBe(400);

            const resBadEmail = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderA", email: "invalid-email", password: rawPassword });
            expect(resBadEmail.statusCode).toBe(400);
        });

        test("Signup should register User A with HttpOnly cookie and ZERO token in JSON", async () => {
            const res = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderA", email: emailA, password: rawPassword });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user.username).toBe("TraderA");
            expect(res.body.token).toBeUndefined(); // Zero token in JSON payload

            const setCookie = res.headers["set-cookie"];
            expect(setCookie).toBeDefined();
            const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
            expect(cookieStr.toLowerCase()).toContain("httponly");

            userA = await User.findOne({ email: emailA });
            expect(userA).not.toBeNull();
        });

        test("Signup should reject duplicate email registration", async () => {
            const res = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "DuplicateTrader", email: emailA, password: rawPassword });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("already exists");
        });

        test("Login should reject non-existent user with generic error", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: "nonexistent@pulsetrade.com", password: rawPassword });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Incorrect email address or password");
        });

        test("Login should reject incorrect password with generic error", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: emailA, password: "WrongPassword999!" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe("Incorrect email address or password");
        });

        test("Login should authenticate User A and issue session cookie", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: emailA, password: rawPassword });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            const setCookie = res.headers["set-cookie"];
            userACookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];
            expect(userACookie).toContain("token=");
        });

        test("Register and Login User B for user isolation testing", async () => {
            const res = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderB", email: emailB, password: rawPassword });

            expect(res.statusCode).toBe(201);
            userB = await User.findOne({ email: emailB });

            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: emailB, password: rawPassword });

            const setCookie = loginRes.headers["set-cookie"];
            userBCookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];
        });

        test("Protected route should reject unauthenticated requests (401)", async () => {
            const res = await request(app).get("/api/v1/orders/allOrders");
            expect(res.statusCode).toBe(401);
        });

        test("Protected route should reject invalid/tampered token (401)", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders")
                .set("Cookie", "token=invalid.tampered.token");
            expect(res.statusCode).toBe(401);
        });
    });

    // ---------------------------------------------------------
    // 3. Wallet Deposit & Margin Setup for User A
    // ---------------------------------------------------------
    describe("3. Wallet & Margin Operations", () => {
        test("Deposit ₹50,000 into User A wallet", async () => {
            const res = await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", userACookie)
                .send({ amount: 50000, action: "ADD" });

            expect(res.statusCode).toBe(200);
            expect(res.body.totalAddedFunds).toBe(50000);

            const tx = await TransactionModel.findOne({ userId: userA._id, type: TRANSACTION_TYPE.DEPOSIT });
            expect(tx).not.toBeNull();
            expect(tx.balanceAfter).toBe(50000);
        });

        test("Withdrawal exceeding available balance should be rejected", async () => {
            const res = await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", userACookie)
                .send({ amount: 999999, action: "WITHDRAW" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("exceeds available cash");
        });
    });

    // ---------------------------------------------------------
    // 4. BUY Orders: Server Validation & Concurrency Safety
    // ---------------------------------------------------------
    describe("4. BUY Orders (GAP 1 & GAP 2: Server-Side Validation & Concurrency)", () => {
        test("BUY with invalid input should be rejected by validation middleware", async () => {
            const resInvalidQty = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: -5, price: 1500, mode: "BUY" });
            expect(resInvalidQty.statusCode).toBe(400);

            const resInvalidPrice = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 2, price: 0, mode: "BUY" });
            expect(resInvalidPrice.statusCode).toBe(400);
        });

        test("BUY with INSUFFICIENT funds should be rejected and recorded as REJECTED", async () => {
            // User A has ₹50,000. Try to BUY 100 shares @ ₹1000 = ₹100,000
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "RELIANCE", qty: 100, price: 1000, mode: "BUY" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("Insufficient wallet balance");

            // Verify order was recorded as REJECTED
            const rejectedOrder = await OrderModel.findOne({
                userId: userA._id,
                name: "RELIANCE",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
            expect(rejectedOrder.failureReason).toContain("Insufficient wallet balance");

            // Verify User A's funds remained unchanged
            const userCheck = await User.findById(userA._id);
            expect(userCheck.funds).toBe(50000);
        });

        test("Valid BUY order should execute atomically, deduct funds, create holding and write ledger", async () => {
            // BUY 5 INFY @ ₹1000 = ₹5,000
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 5, price: 1000, mode: "BUY" });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.remainingFunds).toBe(45000);
            expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);

            // Verify holding created
            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(5);
            expect(holding.avg).toBe(1000);

            // Verify ledger entry
            const tx = await TransactionModel.findOne({
                userId: userA._id,
                type: TRANSACTION_TYPE.ORDER_BUY,
                referenceId: res.body.order._id.toString()
            });
            expect(tx).not.toBeNull();
            expect(tx.amount).toBe(5000);
            expect(tx.balanceAfter).toBe(45000);
        });
    });

    // ---------------------------------------------------------
    // 5. Portfolio Cost Basis (Weighted Average) Math
    // ---------------------------------------------------------
    describe("5. Portfolio Cost Basis (Weighted Average) Math", () => {
        test("Second BUY of INFY should recalculate weighted average cost basis accurately", async () => {
            // Previously: 5 INFY @ ₹1000 (total basis = ₹5,000)
            // Now: BUY 5 INFY @ ₹1200 (cost = ₹6,000)
            // Total: 10 INFY, Total basis = ₹11,000, Weighted Avg = ₹1,100.00
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 5, price: 1200, mode: "BUY" });

            expect(res.statusCode).toBe(201);
            expect(res.body.remainingFunds).toBe(39000);

            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding.qty).toBe(10);
            expect(holding.avg).toBe(1100); // (5000 + 6000) / 10 = 1100
        });
    });

    // ---------------------------------------------------------
    // 6. SELL Orders: Server Validation & Concurrency Safety
    // ---------------------------------------------------------
    describe("6. SELL Orders (GAP 1 & GAP 2: Server-Side Validation & Concurrency)", () => {
        test("SELL stock that user DOES NOT OWN should be rejected", async () => {
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "TCS", qty: 2, price: 3000, mode: "SELL" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("only own 0 share(s)");

            const rejectedOrder = await OrderModel.findOne({
                userId: userA._id,
                name: "TCS",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
        });

        test("SELL MORE shares than owned should be rejected", async () => {
            // User A owns 10 INFY. Try to SELL 15 INFY.
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 15, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("only own 10 share(s)");

            // Verify holdings unchanged
            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding.qty).toBe(10);
        });

        test("Valid partial SELL should deduct shares, credit proceeds, and keep holding", async () => {
            // User A owns 10 INFY. SELL 4 INFY @ ₹1300 = ₹5,200 proceeds.
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 4, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(201);
            expect(res.body.totalFunds).toBe(44200); // 39000 + 5200

            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(6);
            expect(holding.avg).toBe(1100); // Cost basis remains 1100 for remaining shares
        });

        test("Valid complete SELL should delete holding record when qty reaches 0", async () => {
            // User A owns 6 INFY. SELL remaining 6 INFY @ ₹1300 = ₹7,800.
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 6, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(201);
            expect(res.body.totalFunds).toBe(52000); // 44200 + 7800

            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding).toBeNull(); // Clean deletion
        });
    });

    // ---------------------------------------------------------
    // 7. Strict User Isolation & Access Control (GAP 9)
    // ---------------------------------------------------------
    describe("7. User Isolation & Access Control (GAP 9)", () => {
        beforeAll(async () => {
            // User A buys 2 TATAPOWER
            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "TATAPOWER", qty: 2, price: 200, mode: "BUY" });

            // User B deposits ₹10,000 and buys 1 WIPRO
            await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", userBCookie)
                .send({ amount: 10000, action: "ADD" });

            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userBCookie)
                .send({ name: "WIPRO", qty: 1, price: 500, mode: "BUY" });
        });

        test("User B should never see User A's orders in /allOrders", async () => {
            const resB = await request(app)
                .get("/api/v1/orders/allOrders?page=1&limit=50")
                .set("Cookie", userBCookie);

            expect(resB.statusCode).toBe(200);
            expect(resB.body.data.every(o => o.userId.toString() === userB._id.toString())).toBe(true);
            expect(resB.body.data.some(o => o.name === "TATAPOWER")).toBe(false);
        });

        test("User B should never see User A's holdings in /allHoldings", async () => {
            const resB = await request(app)
                .get("/api/v1/holdings/allHoldings")
                .set("Cookie", userBCookie);

            expect(resB.statusCode).toBe(200);
            expect(resB.body.every(h => h.userId.toString() === userB._id.toString())).toBe(true);
            expect(resB.body.some(h => h.name === "TATAPOWER")).toBe(false);
            expect(resB.body.some(h => h.name === "WIPRO")).toBe(true);
        });

        test("User B should never see User A's wallet transactions", async () => {
            const resB = await request(app)
                .get("/api/v1/wallet/user/transactions")
                .set("Cookie", userBCookie);

            expect(resB.statusCode).toBe(200);
            expect(resB.body.every(tx => tx.userId.toString() === userB._id.toString())).toBe(true);
        });

        test("User B funds check returns only User B's balance", async () => {
            const resB = await request(app)
                .get("/api/v1/wallet/user/funds")
                .set("Cookie", userBCookie);

            expect(resB.statusCode).toBe(200);
            expect(resB.body.totalAddedFunds).toBe(9500); // 10000 - 500
        });
    });

    // ---------------------------------------------------------
    // 8. Orders Pagination, Filtering & Sorting
    // ---------------------------------------------------------
    describe("8. Orders Pagination, Filtering & Sorting", () => {
        test("GET /api/v1/orders/allOrders with pagination metadata", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?page=1&limit=2")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(2);
            expect(res.body.pagination.totalOrders).toBeGreaterThanOrEqual(4);
            expect(res.body.data.length).toBe(2);
        });

        test("Filter by mode (BUY) should only return BUY orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?mode=BUY")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(o => o.mode === "BUY")).toBe(true);
        });

        test("Filter by symbol (TATAPOWER) should return matching stock orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?symbol=TATAPOWER")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(o => o.name === "TATAPOWER")).toBe(true);
        });
    });

    // ---------------------------------------------------------
    // 9. Razorpay Sandbox Idempotency & Signature Verification
    // ---------------------------------------------------------
    describe("9. Razorpay Sandbox Idempotency & Cryptographic Verification", () => {
        test("Valid HMAC-SHA256 signature should credit funds and prevent duplicate replay", async () => {
            const paymentId = `pay_sim_${Date.now()}`;
            const orderId = `order_sim_${Date.now()}`;
            const amount = 25000;

            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            // Initial deposit
            const res1 = await request(app)
                .post("/api/v1/wallet/verify-razorpay-payment")
                .set("Cookie", userACookie)
                .send({
                    amount,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: signature
                });

            expect(res1.statusCode).toBe(200);
            expect(res1.body.status).toBe(true);

            // Replay attack / duplicate webhook callback
            const res2 = await request(app)
                .post("/api/v1/wallet/verify-razorpay-payment")
                .set("Cookie", userACookie)
                .send({
                    amount,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: signature
                });

            expect(res2.statusCode).toBe(200);
            expect(res2.body.idempotentReplay).toBe(true); // Handled idempotently without duplicate credit
        });

        test("Tampered signature should be rejected (400)", async () => {
            const res = await request(app)
                .post("/api/v1/wallet/verify-razorpay-payment")
                .set("Cookie", userACookie)
                .send({
                    amount: 5000,
                    razorpay_payment_id: `pay_fake_${Date.now()}`,
                    razorpay_order_id: `order_fake_${Date.now()}`,
                    razorpay_signature: "tampered_fake_signature"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("signature verification failed");
        });
    });

    // ---------------------------------------------------------
    // 10. Backward Compatibility Root Aliases
    // ---------------------------------------------------------
    describe("10. Backward Compatibility Root Route Aliases", () => {
        test("GET /allHoldings root alias should return array", async () => {
            const res = await request(app)
                .get("/allHoldings")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test("GET /user/funds root alias should return funds breakdown", async () => {
            const res = await request(app)
                .get("/user/funds")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.totalAddedFunds).toBeDefined();
        });
    });
});
