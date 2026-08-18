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
const { ORDER_STATUS, ORDER_MODE, TRANSACTION_TYPE, INITIAL_PRICES } = require("../config/constants");

process.env.NODE_ENV = "test";
process.env.TOKEN_KEY = process.env.TOKEN_KEY || "PulseTrade_CI_Test_JWT_Secret_Key_2026!@#";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "pulsetrade_mock_test_secret_for_hmac_signatures";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

describe("PulseTrade Paper-Trading Backend Test Suite", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";

    const emailA = `test_trader_a_${Date.now()}@pulsetrade.com`;
    const emailB = `test_trader_b_${Date.now()}@pulsetrade.com`;
    const rawPassword = "StrongTradingPassword123!";

    beforeAll(async () => {
        process.env.RAZORPAY_KEY_SECRET = RAZORPAY_SECRET;
        process.env.TOKEN_KEY = process.env.TOKEN_KEY || "PulseTrade_CI_Test_JWT_Secret_Key_2026!@#";
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
            if (res.body.memory) {
                expect(res.body.memory.heapUsedMB).toBeGreaterThan(0);
            }
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
    // 2. Authentication, Centralized Validation & Security
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
            expect(res.body.token).toBeUndefined();

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

        test("Login should reject non-existent user with 401 Unauthorized generic error", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: "nonexistent@pulsetrade.com", password: rawPassword });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe("Incorrect email address or password");
        });

        test("Login should reject incorrect password with 401 Unauthorized generic error", async () => {
            const res = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: emailA, password: "WrongPassword999!" });

            expect(res.statusCode).toBe(401);
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

        test("Update profile should require authentication and validate fields", async () => {
            const res = await request(app)
                .post("/api/v1/auth/updateProfile")
                .set("Cookie", userACookie)
                .send({ bio: "Paper trader experimenting with quantitative swing strategies." });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.user.bio).toContain("Paper trader");
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

        test("POST /logout-all should revoke all existing JWT sessions via tokenVersion increment", async () => {
            const revocationEmail = `test_revoke_${Date.now()}@pulsetrade.com`;
            await request(app)
                .post("/api/v1/auth/signup")
                .send({ username: "TraderRevoke", email: revocationEmail, password: rawPassword });

            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({ email: revocationEmail, password: rawPassword });

            const setCookie = loginRes.headers["set-cookie"];
            const revokeCookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];

            // Verify cookie currently works
            const checkRes1 = await request(app)
                .get("/api/v1/orders/allOrders")
                .set("Cookie", revokeCookie);
            expect(checkRes1.statusCode).toBe(200);

            // Call logout-all
            const logoutAllRes = await request(app)
                .post("/api/v1/auth/logout-all")
                .set("Cookie", revokeCookie);
            expect(logoutAllRes.statusCode).toBe(200);
            expect(logoutAllRes.body.message).toContain("Successfully signed out from all devices");

            // Attempt to use the old JWT token - must be rejected with 401
            const checkRes2 = await request(app)
                .get("/api/v1/orders/allOrders")
                .set("Cookie", revokeCookie);
            expect(checkRes2.statusCode).toBe(401);
            expect(checkRes2.body.message).toContain("revoked");
        });
    });

    // ---------------------------------------------------------
    // 3. Wallet Deposit & Correct Financial Semantics
    // ---------------------------------------------------------
    describe("3. Wallet & Margin Operations (Financial Semantics)", () => {
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

        test("GET /api/v1/wallet/user/funds should reflect ₹100,000 available cash without double-subtraction", async () => {
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
    });

    // ---------------------------------------------------------
    // 4. BUY Orders: Server Validation, Limit Logic & Transactions
    // ---------------------------------------------------------
    describe("4. BUY Orders (Server Validation, Limit Checks & ACID Transactions)", () => {
        test("BUY with invalid input or unsupported product type should be rejected", async () => {
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

            const resUnsupportedProduct = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 2, price: 1500, mode: "BUY", productType: "MIS" });
            expect(resUnsupportedProduct.statusCode).toBe(400);
            expect(resUnsupportedProduct.body.message).toContain("Only CNC");

            const resUnsupportedSymbol = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "FAKE_INSTRUMENT_999", qty: 2, price: 100, mode: "BUY" });
            expect(resUnsupportedSymbol.statusCode).toBe(400);
            expect(resUnsupportedSymbol.body.message).toContain("not a supported tradable stock");
        });

        test("BUY with INSUFFICIENT funds should be rejected and recorded as REJECTED", async () => {
            // User A has ₹90,000. Try to BUY 1000 shares @ ₹1000 = ₹1,000,000
            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "RELIANCE", qty: 1000, price: 1000, mode: "BUY" });

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
            expect(userCheck.funds).toBe(90000);
        });

        test("LIMIT BUY rejected when limit price is lower than market price", async () => {
            const marketPrice = INITIAL_PRICES["TATAPOWER"] || 124.15;
            const lowLimitPrice = Number((marketPrice - 50).toFixed(2));

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({
                    name: "TATAPOWER",
                    qty: 5,
                    price: lowLimitPrice,
                    requestedPrice: lowLimitPrice,
                    mode: "BUY",
                    orderType: "LIMIT"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("below current market price");

            const rejectedOrder = await OrderModel.findOne({
                userId: userA._id,
                name: "TATAPOWER",
                orderType: "LIMIT",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
        });

        test("LIMIT BUY executes when limit price is at or above market price", async () => {
            const marketPrice = INITIAL_PRICES["TATAPOWER"] || 124.15;
            const highLimitPrice = Number((marketPrice + 50).toFixed(2));

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({
                    name: "TATAPOWER",
                    qty: 5,
                    price: highLimitPrice,
                    requestedPrice: highLimitPrice,
                    mode: "BUY",
                    orderType: "LIMIT"
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);

            const holding = await HoldingModel.findOne({ userId: userA._id, name: "TATAPOWER" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(5);
        });

        test("Valid MARKET BUY order executes atomically, deducts funds, creates holding and ledger", async () => {
            const userBefore = await User.findById(userA._id);
            const initialFunds = userBefore.funds;

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 5, price: 1000, mode: "BUY", orderType: "MARKET" });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);
            expect(res.body.order.marketPrice).toBeGreaterThan(0);
            expect(res.body.order.executedPrice).toBeGreaterThan(0);

            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(5);

            const tx = await TransactionModel.findOne({
                userId: userA._id,
                type: TRANSACTION_TYPE.ORDER_BUY,
                referenceId: res.body.order._id.toString()
            });
            expect(tx).not.toBeNull();
            expect(tx.status).toBe("SUCCESS");
        });
    });

    // ---------------------------------------------------------
    // 5. Portfolio Cost Basis (Weighted Average) Math
    // ---------------------------------------------------------
    describe("5. Portfolio Cost Basis (Weighted Average) Math", () => {
        test("Second BUY of INFY should recalculate weighted average cost basis accurately", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            const initialQty = holdingBefore.qty;
            const initialAvg = holdingBefore.avg;

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: 5, price: 1200, mode: "BUY" });

            expect(res.statusCode).toBe(201);

            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holdingAfter.qty).toBe(initialQty + 5);

            const expectedBasis = (initialQty * initialAvg) + (5 * res.body.order.executedPrice);
            const expectedAvg = Number((expectedBasis / (initialQty + 5)).toFixed(2));
            expect(holdingAfter.avg).toBe(expectedAvg);
        });
    });

    // ---------------------------------------------------------
    // 6. SELL Orders: Validation, Limit Checks & ACID Transactions
    // ---------------------------------------------------------
    describe("6. SELL Orders (Server Validation, Limit Checks & Concurrency)", () => {
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
            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            const owned = holding.qty;

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: owned + 10, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain(`only own ${owned} share(s)`);

            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holdingAfter.qty).toBe(owned);
        });

        test("LIMIT SELL rejected when limit price is higher than current market price", async () => {
            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            const currentMarketPrice = INITIAL_PRICES["INFY"] || 1555.45;
            const highLimitPrice = Number((currentMarketPrice + 5000).toFixed(2));

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({
                    name: "INFY",
                    qty: 2,
                    price: highLimitPrice,
                    requestedPrice: highLimitPrice,
                    mode: "SELL",
                    orderType: "LIMIT"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain("above current market price");

            const rejectedOrder = await OrderModel.findOne({
                userId: userA._id,
                name: "INFY",
                orderType: "LIMIT",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
        });

        test("Valid partial SELL should deduct shares, credit proceeds, and keep holding", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            const qtyToSell = 4;
            const userBefore = await User.findById(userA._id);

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: qtyToSell, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(201);
            expect(res.body.totalFunds).toBeGreaterThan(userBefore.funds);

            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holdingAfter).not.toBeNull();
            expect(holdingAfter.qty).toBe(holdingBefore.qty - qtyToSell);
            expect(holdingAfter.avg).toBe(holdingBefore.avg);
        });

        test("Valid complete SELL should delete holding record when qty reaches 0", async () => {
            const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            const remainingQty = holding.qty;

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "INFY", qty: remainingQty, price: 1300, mode: "SELL" });

            expect(res.statusCode).toBe(201);

            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
            expect(holdingAfter).toBeNull();
        });
    });

    // ---------------------------------------------------------
    // 7. Strict User Isolation & Access Control
    // ---------------------------------------------------------
    describe("7. User Isolation & Access Control", () => {
        beforeAll(async () => {
            // User B deposits ₹20,000 and buys 1 WIPRO
            await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", userBCookie)
                .send({ amount: 20000, action: "ADD" });

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
            expect(resB.body.data.every(tx => tx.userId.toString() === userB._id.toString())).toBe(true);
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
            expect(res.body.pagination.totalOrders).toBeGreaterThanOrEqual(3);
            expect(res.body.data.length).toBe(2);
        });

        test("Filter by mode (BUY) should only return BUY orders", async () => {
            const res = await request(app)
                .get("/api/v1/orders/allOrders?mode=BUY")
                .set("Cookie", userACookie);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.every(o => o.mode === "BUY")).toBe(true);
        });
    });

    // ---------------------------------------------------------
    // 9. Razorpay Server-Side Validation, Security & Atomic Credit
    // ---------------------------------------------------------
    describe("9. Razorpay Server-Side Validation & Atomic Credit", () => {
        let createdOrderId = "";

        test("Verification should REJECT when NO server-created pending record exists", async () => {
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

        test("Valid signature with matching server order amount credits funds atomically and allows idempotent replay", async () => {
            const paymentId = `pay_valid_${Date.now()}`;
            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${createdOrderId}|${paymentId}`)
                .digest("hex");

            const userBefore = await User.findById(userA._id);
            const balanceBefore = userBefore.funds;

            // Initial verification & credit
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

            // Verify payment record updated to SUCCESS
            const updatedRecord = await PaymentRecordModel.findOne({ razorpay_order_id: createdOrderId });
            expect(updatedRecord.status).toBe("SUCCESS");
            expect(updatedRecord.razorpay_payment_id).toBe(paymentId);

            // Verify transaction ledger created
            const tx = await TransactionModel.findOne({ referenceId: paymentId });
            expect(tx).not.toBeNull();
            expect(tx.amount).toBe(25000);

            // Replay attack / Repeated verification
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

            // Balance must not increase again
            const userAfterReplay = await User.findById(userA._id);
            expect(userAfterReplay.funds).toBe(balanceBefore + 25000);
        });
    });

    // ---------------------------------------------------------
    // 10. Backward Compatibility Root Aliases & Ledger Queries
    // ---------------------------------------------------------
    describe("10. Backward Compatibility & Paginated Transaction Ledger", () => {
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

    // ---------------------------------------------------------
    // 11. ACID Transaction Rollback & Failure-Injection Verification
    // ---------------------------------------------------------
    describe("11. ACID Transaction Rollback & Failure-Injection Verification", () => {
        test("BUY order failure-injection should rollback funds and holdings completely", async () => {
            const userBefore = await User.findById(userA._id);
            const initialFunds = userBefore.funds;

            // Spy and mock TransactionModel.create to throw a simulated database failure
            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated database write crash during BUY transaction");
            });

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "RELIANCE", qty: 2, price: 2112.4, mode: "BUY", orderType: "MARKET" });

            // Must fail due to transaction abort
            expect(res.statusCode).toBeGreaterThanOrEqual(400);

            // 1. Verify User A funds were NOT deducted (rolled back 100%)
            const userAfter = await User.findById(userA._id);
            expect(userAfter.funds).toBe(initialFunds);

            // 2. Verify RELIANCE holding was NOT created (rolled back 100%)
            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "RELIANCE" });
            expect(holdingAfter).toBeNull();

            // 3. Verify no executed order record leaked into database
            const orderCheck = await OrderModel.findOne({
                userId: userA._id,
                name: "RELIANCE",
                status: ORDER_STATUS.EXECUTED
            });
            expect(orderCheck).toBeNull();

            spy.mockRestore();
        });

        test("SELL order failure-injection should rollback holding quantity and funds completely", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: userA._id, name: "TATAPOWER" });
            expect(holdingBefore).not.toBeNull();
            const initialQty = holdingBefore.qty;

            const userBefore = await User.findById(userA._id);
            const initialFunds = userBefore.funds;

            // Spy and mock TransactionModel.create to throw a simulated failure on SELL ledger write
            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated database write crash during SELL transaction");
            });

            const res = await request(app)
                .post("/api/v1/orders/newOrders")
                .set("Cookie", userACookie)
                .send({ name: "TATAPOWER", qty: 2, price: 124.15, mode: "SELL", orderType: "MARKET" });

            // Must fail due to transaction abort
            expect(res.statusCode).toBeGreaterThanOrEqual(400);

            // 1. Verify TATAPOWER holding quantity was NOT reduced (rolled back 100%)
            const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "TATAPOWER" });
            expect(holdingAfter.qty).toBe(initialQty);

            // 2. Verify User A funds were NOT credited (rolled back 100%)
            const userAfter = await User.findById(userA._id);
            expect(userAfter.funds).toBe(initialFunds);

            spy.mockRestore();
        });

        test("Wallet deposit failure-injection should rollback funds increment completely", async () => {
            const userBefore = await User.findById(userA._id);
            const initialFunds = userBefore.funds;

            // Spy and mock TransactionModel.create during deposit
            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated database crash during Deposit ledger write");
            });

            const res = await request(app)
                .post("/api/v1/wallet/user/funds")
                .set("Cookie", userACookie)
                .send({ amount: 50000, action: "ADD" });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);

            // Verify User A funds were NOT incremented
            const userAfter = await User.findById(userA._id);
            expect(userAfter.funds).toBe(initialFunds);

            spy.mockRestore();
        });
    });
});
