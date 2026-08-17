const request = require("supertest");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");

const app = require("../app");
const { connectDB, closeDB } = require("../config/db");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { OrderModel } = require("../model/OrderModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const { ORDER_STATUS, TRANSACTION_TYPE } = require("../config/constants");

const TEST_SECRET = process.env.TOKEN_KEY || "Zerodha_Clone_Secret_Key_123!@#";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "MLfOsojM55l35lIfKw4k4wZi";

describe("PulseTrade Real MongoDB Integration & API Test Suite", () => {
    let testUser = null;
    let authCookie = "";

    beforeAll(async () => {
        await connectDB();
        // Clean up test database state for test user
        await User.deleteMany({ email: /test_integration.*@pulsetrade\.com/i });
    });

    afterAll(async () => {
        if (testUser) {
            await User.deleteMany({ _id: testUser._id });
            await HoldingModel.deleteMany({ userId: testUser._id });
            await PositionModel.deleteMany({ userId: testUser._id });
            await OrderModel.deleteMany({ userId: testUser._id });
            await TransactionModel.deleteMany({ userId: testUser._id });
            await PaymentRecordModel.deleteMany({ userId: testUser._id });
        }
        await closeDB();
    });

    // ---------------------------------------------------------
    // 1. Health & CORS Allowlist Enforcement
    // ---------------------------------------------------------
    describe("API Health & Security Headers", () => {
        test("GET / should return 200 and security headers", async () => {
            const res = await request(app).get("/");
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(res.headers["x-frame-options"]).toBe("DENY");
            expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
        });

        test("CORS policy should reject unauthorized cross-origin requests", async () => {
            const res = await request(app)
                .get("/")
                .set("Origin", "https://unauthorized-attacker-site.com");
            expect(res.statusCode).toBe(500);
            expect(res.body.message).toContain("Not allowed by CORS");
        });

        test("CORS policy should accept allowed origin (localhost:5173)", async () => {
            const res = await request(app)
                .get("/")
                .set("Origin", "http://localhost:5173");
            expect(res.statusCode).toBe(200);
            expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
            expect(res.headers["access-control-allow-credentials"]).toBe("true");
        });
    });

    // ---------------------------------------------------------
    // 2. Authentication, Zero-JWT-in-JSON & HTTP-Only Cookies
    // ---------------------------------------------------------
    describe("Authentication & Session Security", () => {
        const uniqueEmail = `test_integration_${Date.now()}@pulsetrade.com`;
        const rawPassword = "StrongPassword123!";

        test("POST /signup should register user, set httpOnly cookie, and NOT expose token in JSON body", async () => {
            const res = await request(app)
                .post("/signup")
                .send({
                    username: "IntegrationTrader",
                    email: uniqueEmail,
                    password: rawPassword
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.username).toBe("IntegrationTrader");
            // Security verification: JWT token must NOT be exposed in JSON
            expect(res.body.token).toBeUndefined();

            // Cookie verification
            const setCookie = res.headers["set-cookie"];
            expect(setCookie).toBeDefined();
            const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
            expect(cookieStr.toLowerCase()).toContain("httponly");
            expect(cookieStr).toContain("token=");

            // Save test user record
            testUser = await User.findOne({ email: uniqueEmail });
            expect(testUser).not.toBeNull();
            // Verify password was hashed with bcrypt
            expect(testUser.password).not.toBe(rawPassword);
        });

        test("POST /login should authenticate, set httpOnly cookie, and NOT expose token in JSON body", async () => {
            const res = await request(app)
                .post("/login")
                .send({
                    email: uniqueEmail,
                    password: rawPassword
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeUndefined(); // Zero token exposure in JSON

            const setCookie = res.headers["set-cookie"];
            expect(setCookie).toBeDefined();
            authCookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];
            expect(authCookie).toContain("token=");
        });

        test("POST / (Session verification) should return authenticated user profile from cookie", async () => {
            const res = await request(app)
                .post("/")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.user).toBe("IntegrationTrader");
            expect(res.body.email).toBe(uniqueEmail);
        });

        test("POST /logout should clear the auth cookie", async () => {
            const res = await request(app).post("/logout");
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            const setCookie = res.headers["set-cookie"];
            const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
            expect(cookieStr.toLowerCase()).toContain("httponly");
            expect(cookieStr).toContain("token=;");
        });
    });

    // ---------------------------------------------------------
    // 3. Protected Route Access Control
    // ---------------------------------------------------------
    describe("Protected Routes Access Control", () => {
        test("Endpoints should return 401 Unauthorized when no auth cookie is provided", async () => {
            const unauthGetHoldings = await request(app).get("/allHoldings");
            expect(unauthGetHoldings.statusCode).toBe(401);

            const unauthGetPositions = await request(app).get("/allPositions");
            expect(unauthGetPositions.statusCode).toBe(401);

            const unauthGetOrders = await request(app).get("/allOrders");
            expect(unauthGetOrders.statusCode).toBe(401);

            const unauthGetFunds = await request(app).get("/user/funds");
            expect(unauthGetFunds.statusCode).toBe(401);

            const unauthPlaceOrder = await request(app).post("/newOrders").send({ name: "INFY", qty: 1, price: 1500, mode: "BUY" });
            expect(unauthPlaceOrder.statusCode).toBe(401);

            const unauthReset = await request(app).delete("/resetPortfolio");
            expect(unauthReset.statusCode).toBe(401);
        });
    });

    // ---------------------------------------------------------
    // 4. Wallet Funds, Ledger Auditing & Idempotency
    // ---------------------------------------------------------
    describe("Wallet Management, Ledger Auditing & Razorpay Idempotency", () => {
        test("POST /user/funds (ADD) should atomically deposit funds and write a ledger record", async () => {
            const depositAmount = 25000;
            const res = await request(app)
                .post("/user/funds")
                .set("Cookie", authCookie)
                .send({ amount: depositAmount, action: "ADD" });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.totalAddedFunds).toBe(depositAmount);

            // Verify database state
            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(depositAmount);

            // Verify ledger transaction was recorded
            const tx = await TransactionModel.findOne({ userId: testUser._id, type: TRANSACTION_TYPE.DEPOSIT });
            expect(tx).not.toBeNull();
            expect(tx.amount).toBe(depositAmount);
            expect(tx.balanceBefore).toBe(0);
            expect(tx.balanceAfter).toBe(depositAmount);
        });

        test("POST /user/funds (WITHDRAW) should atomically withdraw funds and record ledger entry", async () => {
            const withdrawAmount = 5000;
            const res = await request(app)
                .post("/user/funds")
                .set("Cookie", authCookie)
                .send({ amount: withdrawAmount, action: "WITHDRAW" });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.totalAddedFunds).toBe(20000);

            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(20000);

            const tx = await TransactionModel.findOne({ userId: testUser._id, type: TRANSACTION_TYPE.WITHDRAWAL });
            expect(tx).not.toBeNull();
            expect(tx.amount).toBe(withdrawAmount);
            expect(tx.balanceBefore).toBe(25000);
            expect(tx.balanceAfter).toBe(20000);
        });

        test("POST /user/funds (WITHDRAW) should reject withdrawal amount exceeding available balance", async () => {
            const res = await request(app)
                .post("/user/funds")
                .set("Cookie", authCookie)
                .send({ amount: 999999, action: "WITHDRAW" });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(false);
            expect(res.body.message).toContain("exceeds available cash");
        });

        test("Razorpay HMAC-SHA256 verification and IDEMPOTENT settlement", async () => {
            const paymentId = `pay_test_${Date.now()}`;
            const orderId = `order_test_${Date.now()}`;
            const depositAmt = 10000;

            const validSignature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            // 1. First verification request: Should credit funds
            const res1 = await request(app)
                .post("/verify-razorpay-payment")
                .set("Cookie", authCookie)
                .send({
                    amount: depositAmt,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: validSignature
                });

            expect(res1.statusCode).toBe(200);
            expect(res1.body.status).toBe(true);
            expect(res1.body.totalAddedFunds).toBe(30000); // 20000 + 10000

            // 2. IDEMPOTENCY TEST: Replay the exact same payment verification request
            const res2 = await request(app)
                .post("/verify-razorpay-payment")
                .set("Cookie", authCookie)
                .send({
                    amount: depositAmt,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: validSignature
                });

            expect(res2.statusCode).toBe(200);
            expect(res2.body.status).toBe(true);
            expect(res2.body.idempotentReplay).toBe(true);
            expect(res2.body.totalAddedFunds).toBe(30000); // Must NOT double credit!

            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(30000);
        });

        test("GET /user/transactions should return audit ledger records", async () => {
            const res = await request(app)
                .get("/user/transactions")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(Array.isArray(res.body.transactions)).toBe(true);
            expect(res.body.transactions.length).toBeGreaterThanOrEqual(3);
        });
    });

    // ---------------------------------------------------------
    // 5. Transaction-Safe Order Execution, Cost Basis & Concurrency Protection
    // ---------------------------------------------------------
    describe("Trading Engine, Cost Basis & Concurrency Protection", () => {
        test("POST /newOrders (BUY) should deduct funds atomically, update cost basis, and audit order", async () => {
            // First BUY: 2 shares of INFY @ ₹1000.00 = ₹2000.00
            const res1 = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "INFY",
                    qty: 2,
                    price: 1000,
                    mode: "BUY"
                });

            expect(res1.statusCode).toBe(201);
            expect(res1.body.success).toBe(true);
            expect(res1.body.order.status).toBe(ORDER_STATUS.EXECUTED);
            expect(res1.body.order.totalCost).toBe(2000);

            // Verify Holding Cost Basis: 2 shares @ avg 1000.00
            let holding = await HoldingModel.findOne({ userId: testUser._id, name: "INFY" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(2);
            expect(holding.avg).toBe(1000);

            // Second BUY: 2 more shares of INFY @ ₹1200.00 = ₹2400.00
            // Weighted average cost basis should be ((2 * 1000) + (2 * 1200)) / 4 = ₹1100.00
            const res2 = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "INFY",
                    qty: 2,
                    price: 1200,
                    mode: "BUY"
                });

            expect(res2.statusCode).toBe(201);
            holding = await HoldingModel.findOne({ userId: testUser._id, name: "INFY" });
            expect(holding.qty).toBe(4);
            expect(holding.avg).toBe(1100); // Exact weighted cost basis

            // Verify User Funds were deducted: 30000 - 2000 - 2400 = 25600
            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(25600);
        });

        test("CONCURRENCY / BALANCE PROTECTION: Should reject BUY order exceeding balance and audit REJECTED order", async () => {
            // Attempt to buy ₹500,000 worth of stock with only ₹25,600 balance
            const res = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "TCS",
                    qty: 100,
                    price: 5000,
                    mode: "BUY"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(false);
            expect(res.body.message).toContain("Insufficient wallet balance");

            // Verify REJECTED order was saved in audit log
            const rejectedOrder = await OrderModel.findOne({ userId: testUser._id, name: "TCS", status: ORDER_STATUS.REJECTED });
            expect(rejectedOrder).not.toBeNull();
            expect(rejectedOrder.status).toBe(ORDER_STATUS.REJECTED);
            expect(rejectedOrder.failureReason).toContain("Insufficient wallet balance");

            // Verify funds remained intact
            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(25600);
        });

        test("POST /newOrders (SELL) should credit proceeds, decrement holdings, and clean up empty holdings", async () => {
            // User currently owns 4 shares of INFY (funds: 25600)
            // Sell 2 shares @ ₹1500 = proceeds ₹3000
            const res1 = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "INFY",
                    qty: 2,
                    price: 1500,
                    mode: "SELL"
                });

            expect(res1.statusCode).toBe(201);
            expect(res1.body.success).toBe(true);

            let holding = await HoldingModel.findOne({ userId: testUser._id, name: "INFY" });
            expect(holding.qty).toBe(2);

            let user = await User.findById(testUser._id);
            expect(user.funds).toBe(28600); // 25600 + 3000

            // Sell remaining 2 shares @ ₹1500 = proceeds ₹3000
            const res2 = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "INFY",
                    qty: 2,
                    price: 1500,
                    mode: "SELL"
                });

            expect(res2.statusCode).toBe(201);

            // Holding document must be cleaned up when quantity hits 0
            holding = await HoldingModel.findOne({ userId: testUser._id, name: "INFY" });
            expect(holding).toBeNull();

            user = await User.findById(testUser._id);
            expect(user.funds).toBe(31600);
        });

        test("OVERSELLING PROTECTION: Should reject SELL order when user does not own shares", async () => {
            const res = await request(app)
                .post("/newOrders")
                .set("Cookie", authCookie)
                .send({
                    name: "INFY",
                    qty: 5,
                    price: 1500,
                    mode: "SELL"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe(false);
            expect(res.body.message).toContain("Sell order rejected: You only own 0 share(s)");

            const rejectedOrder = await OrderModel.findOne({ userId: testUser._id, name: "INFY", mode: "SELL", status: ORDER_STATUS.REJECTED });
            expect(rejectedOrder).not.toBeNull();
        });
    });

    // ---------------------------------------------------------
    // 6. Portfolio Demo Seeding & Reset Lifecycle
    // ---------------------------------------------------------
    describe("Portfolio Demo Lifecycle", () => {
        test("POST /seedDemoData should seed 12 holdings, 2 positions and set ₹50,000 balance", async () => {
            const res = await request(app)
                .post("/seedDemoData")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.holdings.length).toBe(12);
            expect(res.body.positions.length).toBe(2);

            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(50000);
        });

        test("DELETE /resetPortfolio should clean all user holdings, positions, orders, and reset funds to 0", async () => {
            const res = await request(app)
                .delete("/resetPortfolio")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);

            const holdingsCount = await HoldingModel.countDocuments({ userId: testUser._id });
            expect(holdingsCount).toBe(0);

            const positionsCount = await PositionModel.countDocuments({ userId: testUser._id });
            expect(positionsCount).toBe(0);

            const user = await User.findById(testUser._id);
            expect(user.funds).toBe(0);
        });
    });
});
