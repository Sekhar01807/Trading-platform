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

describe("PulseTrade Enterprise Backend API & MongoDB Test Suite", () => {
    let testUser = null;
    let authCookie = "";

    beforeAll(async () => {
        await connectDB();
        await User.deleteMany({ email: /test_v1_integration.*@pulsetrade\.com/i });
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
    // 1. Health, Diagnostics, Swagger & Observability
    // ---------------------------------------------------------
    describe("System Health, Swagger Docs & Observability", () => {
        test("GET /health should return 200 with system diagnostics and DB ping", async () => {
            const res = await request(app).get("/health");
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("healthy");
            expect(res.body.database.status).toBe("connected");
            expect(res.body.database.latencyMs).toBeDefined();
            expect(res.body.memory.heapUsedMB).toBeGreaterThan(0);
            expect(res.body.uptime.seconds).toBeDefined();
        });

        test("GET /api/v1/health should mirror the health endpoint", async () => {
            const res = await request(app).get("/api/v1/health");
            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe("healthy");
        });

        test("GET /api-docs.json should serve OpenAPI 3.0 specification", async () => {
            const res = await request(app).get("/api-docs.json");
            expect(res.statusCode).toBe(200);
            expect(res.body.openapi).toBe("3.0.3");
            expect(res.body.info.title).toContain("PulseTrade");
            expect(res.body.paths["/orders/newOrders"]).toBeDefined();
        });

        test("GET /api-docs should serve Swagger UI HTML page", async () => {
            const res = await request(app).get("/api-docs");
            expect(res.statusCode).toBe(200);
            expect(res.text).toContain("SwaggerUIBundle");
        });

        test("Request logger should set X-Request-Id correlation header", async () => {
            const res = await request(app).get("/health");
            expect(res.headers["x-request-id"]).toBeDefined();
        });
    });

    // ---------------------------------------------------------
    // 2. Versioned Authentication & Request Validation
    // ---------------------------------------------------------
    describe("Versioned Authentication (/api/v1/auth) & Request Validation", () => {
        const uniqueEmail = `test_v1_integration_${Date.now()}@pulsetrade.com`;
        const rawPassword = "SecureTradingPassword123!";

        test("POST /api/v1/auth/signup should reject invalid request payloads via validation middleware", async () => {
            const resShortPass = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "Trader", email: uniqueEmail, password: "123" });
            expect(resShortPass.statusCode).toBe(400);
            expect(resShortPass.body.message).toContain("Password must be at least 8 characters long");

            const resBadEmail = await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "Trader", email: "not-an-email", password: rawPassword });
            expect(resBadEmail.statusCode).toBe(400);
            expect(resBadEmail.body.message).toContain("valid email address");
        });

        test("POST /api/v1/auth/signup should register user and set HttpOnly cookie with ZERO token in JSON", async () => {
            const res = await request(app)
                .post("/api/v1/auth/signup")
                .send({
                    username: "V1Trader",
                    email: uniqueEmail,
                    password: rawPassword
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.user.username).toBe("V1Trader");
            expect(res.body.token).toBeUndefined(); // Zero token exposure

            const setCookie = res.headers["set-cookie"];
            expect(setCookie).toBeDefined();
            const cookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
            expect(cookieStr.toLowerCase()).toContain("httponly");

            testUser = await User.findOne({ email: uniqueEmail });
            expect(testUser).not.toBeNull();
        });

        test("POST /api/v1/auth/login should authenticate user and issue session cookie", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: uniqueEmail,
                    password: rawPassword
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeUndefined();

            const setCookie = res.headers["set-cookie"];
            authCookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];
            expect(authCookie).toContain("token=");
        });

        test("POST /api/v1/auth/ (Session verification) should return user details from cookie", async () => {
            const res = await request(app)
                .post("/api/v1/auth/")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.user).toBe("V1Trader");
        });
    });

    // ---------------------------------------------------------
    // 3. Wallet Management & Idempotent Settlements
    // ---------------------------------------------------------
    describe("Versioned Wallet API (/api/v1/wallet) & Ledger Auditing", () => {
        test("POST /api/v1/wallet/user/funds (ADD) should deposit funds and write ledger", async () => {
            const res = await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", authCookie)
                .send({ amount: 50000, action: "ADD" });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.totalAddedFunds).toBe(50000);

            const tx = await TransactionModel.findOne({ userId: testUser._id, type: TRANSACTION_TYPE.DEPOSIT });
            expect(tx).not.toBeNull();
            expect(tx.balanceAfter).toBe(50000);
        });

        test("POST /api/v1/wallet/verify-razorpay-payment should verify HMAC-SHA256 with idempotency", async () => {
            const paymentId = `pay_v1_${Date.now()}`;
            const orderId = `order_v1_${Date.now()}`;
            const depositAmt = 15000;

            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const res1 = await request(app)
                .post("/api/v1/wallet/verify-razorpay-payment")
                .set("Cookie", authCookie)
                .send({
                    amount: depositAmt,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: signature
                });

            expect(res1.statusCode).toBe(200);
            expect(res1.body.totalAddedFunds).toBe(65000);

            // Replay same request -> idempotent response without double crediting
            const res2 = await request(app)
                .post("/api/v1/wallet/verify-razorpay-payment")
                .set("Cookie", authCookie)
                .send({
                    amount: depositAmt,
                    razorpay_payment_id: paymentId,
                    razorpay_order_id: orderId,
                    razorpay_signature: signature
                });

            expect(res2.statusCode).toBe(200);
            expect(res2.body.idempotentReplay).toBe(true);
            expect(res2.body.totalAddedFunds).toBe(65000);
        });
    });

    // ---------------------------------------------------------
    // 4. Order Execution, Validation, Pagination & Filtering
    // ---------------------------------------------------------
    describe("Versioned Orders API (/api/v1/orders): Execution, Pagination & Filtering", () => {
        test("POST /api/v1/orders/newOrders should reject invalid order inputs via request validator", async () => {
            const resInvalidQty = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "INFY", qty: -2, price: 1500, mode: "BUY" });
            expect(resInvalidQty.statusCode).toBe(400);

            const resInvalidMode = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "INFY", qty: 2, price: 1500, mode: "INVALID" });
            expect(resInvalidMode.statusCode).toBe(400);
        });

        test("Execute multiple BUY & SELL orders for pagination & filtering tests", async () => {
            // Order 1: BUY 5 INFY @ 1500 = 7500
            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "INFY", qty: 5, price: 1500, mode: "BUY" });

            // Order 2: BUY 2 TCS @ 3200 = 6400
            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "TCS", qty: 2, price: 3200, mode: "BUY" });

            // Order 3: SELL 2 INFY @ 1600 = 3200
            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "INFY", qty: 2, price: 1600, mode: "SELL" });

            // Order 4: BUY 1 RELIANCE @ 2500 = 2500
            await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", authCookie)
                .send({ name: "RELIANCE", qty: 1, price: 2500, mode: "BUY" });
        });

        test("GET /api/v1/orders/allOrders with pagination (page=1&limit=2) should return metadata and 2 orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?page=1&limit=2")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe(true);
            expect(res.body.data.length).toBe(2);
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(2);
            expect(res.body.pagination.totalOrders).toBeGreaterThanOrEqual(4);
            expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(2);
            expect(res.body.pagination.hasNextPage).toBe(true);
        });

        test("GET /api/v1/orders/allOrders with mode filter (mode=SELL) should only return SELL orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?mode=SELL")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(o => o.mode === "SELL")).toBe(true);
        });

        test("GET /api/v1/orders/allOrders with symbol search (symbol=INFY) should filter by stock name", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?symbol=INFY")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(o => o.name === "INFY")).toBe(true);
        });

        test("GET /api/v1/orders/allOrders with sorting (sortBy=price&sortOrder=asc) should return sorted orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?sortBy=price&sortOrder=asc")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            const prices = res.body.data.map(o => o.price);
            const sortedPrices = [...prices].sort((a, b) => a - b);
            expect(prices).toEqual(sortedPrices);
        });
    });

    // ---------------------------------------------------------
    // 5. Backward Compatibility Route Aliases
    // ---------------------------------------------------------
    describe("Legacy Root Route Aliases Backward Compatibility", () => {
        test("GET /allHoldings legacy root route should work identically", async () => {
            const res = await request(app)
                .get("/allHoldings")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        test("GET /user/funds legacy root route should work identically", async () => {
            const res = await request(app)
                .get("/user/funds")
                .set("Cookie", authCookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.totalAddedFunds).toBeDefined();
        });
    });
});
