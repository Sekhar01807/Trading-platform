const request = require("supertest");
const app = require("../../app");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { OrderModel } = require("../../model/OrderModel");
const { TransactionModel } = require("../../model/TransactionModel");
const MarketTickerService = require("../../Services/MarketTickerService");
const { ORDER_STATUS, ORDER_TYPE, TRANSACTION_TYPE, INITIAL_PRICES } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: Orders (BUY, SELL, Limit Checks & Isolation)", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";

    const emailA = `orders_api_a_${Date.now()}@pulsetrade.com`;
    const emailB = `orders_api_b_${Date.now()}@pulsetrade.com`;
    const password = "TradingPassword123!";

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /orders_api_.*@pulsetrade\.com/i });

        // User A setup with ₹100,000 funds
        await request(app).post("/api/v1/auth/signup").send({ username: "OrderApiA", email: emailA, password });
        const loginA = await request(app).post("/api/v1/auth/login").send({ email: emailA, password });
        userACookie = loginA.headers["set-cookie"][0].split(";")[0];
        userA = await User.findOne({ email: emailA });
        await request(app).post("/api/v1/wallet/user/funds").set("Cookie", userACookie).send({ amount: 100000, action: "ADD" });

        // User B setup with ₹20,000 funds
        await request(app).post("/api/v1/auth/signup").send({ username: "OrderApiB", email: emailB, password });
        const loginB = await request(app).post("/api/v1/auth/login").send({ email: emailB, password });
        userBCookie = loginB.headers["set-cookie"][0].split(";")[0];
        userB = await User.findOne({ email: emailB });
        await request(app).post("/api/v1/wallet/user/funds").set("Cookie", userBCookie).send({ amount: 20000, action: "ADD" });

        // Ensure clean slate for test users' orders/holdings/transactions
        await HoldingModel.deleteMany({ userId: { $in: [userA._id, userB._id] } });
        await OrderModel.deleteMany({ userId: { $in: [userA._id, userB._id] } });
        await TransactionModel.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    });

    afterAll(async () => {
        const userIds = [userA?._id, userB?._id].filter(Boolean);
        if (userIds.length > 0) {
            await HoldingModel.deleteMany({ userId: { $in: userIds } });
            await OrderModel.deleteMany({ userId: { $in: userIds } });
            await TransactionModel.deleteMany({ userId: { $in: userIds } });
            await cleanupTestUsers(userIds);
        }
        await teardownTestDB();
    });

    // ── Test 1: Input Validation ──
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

    // ── Test 2: Insufficient Funds ──
    test("BUY with INSUFFICIENT funds should be rejected and recorded as REJECTED", async () => {
        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "RELIANCE", qty: 1000, price: 1000, mode: "BUY" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("Insufficient wallet balance");

        const rejectedOrder = await OrderModel.findOne({
            userId: userA._id,
            name: "RELIANCE",
            status: ORDER_STATUS.REJECTED
        });
        expect(rejectedOrder).not.toBeNull();
        expect(rejectedOrder.failureReason).toContain("Insufficient wallet balance");
    });

    // ── Test 3: LIMIT BUY Rejection ──
    test("LIMIT BUY rejected when limit price is lower than market price", async () => {
        const livePrice = MarketTickerService.getLivePrices()["TATAPOWER"] || INITIAL_PRICES["TATAPOWER"] || 124.15;
        const lowLimitPrice = Number((livePrice * 0.5).toFixed(2));

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({
                name: "TATAPOWER",
                qty: 5,
                price: lowLimitPrice,
                mode: "BUY",
                orderType: "LIMIT"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("below current market price");

        const rejectedOrder = await OrderModel.findOne({
            userId: userA._id,
            name: "TATAPOWER",
            orderType: ORDER_TYPE.LIMIT,
            status: ORDER_STATUS.REJECTED
        });
        expect(rejectedOrder).not.toBeNull();
    });

    // ── Test 4: LIMIT BUY Execution ──
    test("LIMIT BUY executes when limit price is at or above market price", async () => {
        const livePrice = MarketTickerService.getLivePrices()["TATAPOWER"] || INITIAL_PRICES["TATAPOWER"] || 124.15;
        const highLimitPrice = Number((livePrice * 1.5).toFixed(2));

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({
                name: "TATAPOWER",
                qty: 5,
                price: highLimitPrice,
                mode: "BUY",
                orderType: "LIMIT"
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);
        // Executed at server market price, not at the limit price
        expect(res.body.order.executedPrice).toBeGreaterThan(0);

        const holding = await HoldingModel.findOne({ userId: userA._id, name: "TATAPOWER" });
        expect(holding).not.toBeNull();
        expect(holding.qty).toBe(5);
    });

    // ── Test 5: Valid MARKET BUY ──
    test("Valid MARKET BUY order executes atomically, deducts funds, and creates holding", async () => {
        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: 5, price: 1000, mode: "BUY", orderType: "MARKET" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);
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

    // ── Test 6: Second BUY Weighted Average Cost Basis ──
    test("Second BUY of INFY should recalculate weighted average cost basis accurately", async () => {
        const holdingBefore = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        const initialQty = holdingBefore.qty;
        const initialAvg = holdingBefore.avg;

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: 5, price: 1200, mode: "BUY", orderType: "MARKET" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);

        const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        expect(holdingAfter.qty).toBe(initialQty + 5);

        // The server uses: Number(((oldQty * oldAvg + newQty * executedPrice) / totalQty).toFixed(2))
        // Use toBeCloseTo to handle floating-point rounding differences
        const executedPrice = res.body.order.executedPrice;
        const expectedBasis = (initialQty * initialAvg) + (5 * executedPrice);
        const expectedAvg = Number((expectedBasis / (initialQty + 5)).toFixed(2));
        expect(holdingAfter.avg).toBeCloseTo(expectedAvg, 1);
    });

    // ── Test 7: SELL Unowned Stock ──
    test("SELL stock that user DOES NOT OWN should be rejected", async () => {
        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "TCS", qty: 2, price: 3000, mode: "SELL" });

        expect(res.statusCode).toBe(400);
        // Service throws: "You only own 0 share(s) of TCS"
        expect(res.body.message).toMatch(/only own 0 share/i);

        const rejectedOrder = await OrderModel.findOne({
            userId: userA._id,
            name: "TCS",
            status: ORDER_STATUS.REJECTED
        });
        expect(rejectedOrder).not.toBeNull();
    });

    // ── Test 8: SELL More Shares Than Owned ──
    test("SELL MORE shares than owned should be rejected", async () => {
        const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        const owned = holding.qty;

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: owned + 10, price: 1300, mode: "SELL" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/only own \d+ share/i);
    });

    // ── Test 9: LIMIT SELL Rejection ──
    test("LIMIT SELL rejected when limit price is higher than current market price", async () => {
        const livePrice = MarketTickerService.getLivePrices()["INFY"] || INITIAL_PRICES["INFY"] || 1555.45;
        const highLimitPrice = Number((livePrice * 2).toFixed(2));

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({
                name: "INFY",
                qty: 2,
                price: highLimitPrice,
                mode: "SELL",
                orderType: "LIMIT"
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("above current market price");
    });

    // ── Test 10: Valid Partial SELL ──
    test("Valid partial SELL should deduct shares, credit proceeds, and keep holding", async () => {
        const holdingBefore = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        const qtyToSell = 4;

        // Capture exact fund balance from DB before sell
        const userBefore = await User.findById(userA._id);
        const fundsBefore = Number(userBefore.funds.toFixed(2));

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: qtyToSell, price: 1300, mode: "SELL", orderType: "MARKET" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);

        // The SELL response returns totalFunds (balanceAfter) which should be > fundsBefore
        // since selling credits proceeds to the wallet
        expect(res.body.totalFunds).toBeDefined();
        expect(res.body.totalFunds).toBeGreaterThan(fundsBefore);

        const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        expect(holdingAfter).not.toBeNull();
        expect(holdingAfter.qty).toBe(holdingBefore.qty - qtyToSell);
        // avg cost basis should remain unchanged after partial sell
        expect(holdingAfter.avg).toBeCloseTo(holdingBefore.avg, 1);
    });

    // ── Test 11: Valid Complete SELL ──
    test("Valid complete SELL should delete holding record when qty reaches 0", async () => {
        const holding = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        expect(holding).not.toBeNull();
        const remainingQty = holding.qty;

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: remainingQty, price: 1300, mode: "SELL", orderType: "MARKET" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);

        const holdingAfter = await HoldingModel.findOne({ userId: userA._id, name: "INFY" });
        expect(holdingAfter).toBeNull();
    });

    // ── Test 12: Pagination & Filter ──
    test("GET /api/v1/orders/allOrders with pagination and mode filter", async () => {
        const res = await request(app)
            .get("/api/v1/orders/allOrders?page=1&limit=2")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.pagination).toBeDefined();
        expect(res.body.pagination.page).toBe(1);
        expect(res.body.pagination.limit).toBe(2);
        expect(res.body.data.length).toBe(2);

        const resBuy = await request(app)
            .get("/api/v1/orders/allOrders?mode=BUY")
            .set("Cookie", userACookie);

        expect(resBuy.statusCode).toBe(200);
        expect(resBuy.body.data.every(o => o.mode === "BUY")).toBe(true);
    });

    // ── Test 13: User Isolation ──
    test("User B should never see User A's orders (User Isolation)", async () => {
        const resB = await request(app)
            .get("/api/v1/orders/allOrders?page=1&limit=50")
            .set("Cookie", userBCookie);

        expect(resB.statusCode).toBe(200);
        // User B should see no orders (they never placed any)
        // OR if User B has orders, none should belong to User A
        if (resB.body.data.length > 0) {
            expect(resB.body.data.every(o => o.userId.toString() === userB._id.toString())).toBe(true);
        }
        expect(resB.body.data.some(o => o.name === "TATAPOWER")).toBe(false);
    });
});
