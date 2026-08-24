const request = require("supertest");
const app = require("../../app");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { OrderModel } = require("../../model/OrderModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { ORDER_STATUS, TRANSACTION_TYPE, INITIAL_PRICES } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: Orders (BUY, SELL, Limit Checks & Isolation)", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";

    const emailA = `orders_test_a_${Date.now()}@pulsetrade.com`;
    const emailB = `orders_test_b_${Date.now()}@pulsetrade.com`;
    const password = "TradingPassword123!";

    beforeAll(async () => {
        await initTestDB();

        // User A setup with ₹100,000 funds
        await request(app).post("/api/v1/auth/signup").send({ username: "OrderTraderA", email: emailA, password });
        const loginA = await request(app).post("/api/v1/auth/login").send({ email: emailA, password });
        userACookie = loginA.headers["set-cookie"][0].split(";")[0];
        userA = await User.findOne({ email: emailA });
        await request(app).post("/api/v1/wallet/user/funds").set("Cookie", userACookie).send({ amount: 100000, action: "ADD" });

        // User B setup with ₹20,000 funds
        await request(app).post("/api/v1/auth/signup").send({ username: "OrderTraderB", email: emailB, password });
        const loginB = await request(app).post("/api/v1/auth/login").send({ email: emailB, password });
        userBCookie = loginB.headers["set-cookie"][0].split(";")[0];
        userB = await User.findOne({ email: emailB });
        await request(app).post("/api/v1/wallet/user/funds").set("Cookie", userBCookie).send({ amount: 20000, action: "ADD" });
    });

    afterAll(async () => {
        const userIds = [userA?._id, userB?._id].filter(Boolean);
        await cleanupTestUsers(userIds);
        await teardownTestDB();
    });

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

    test("Valid MARKET BUY order executes atomically, deducts funds, and creates holding", async () => {
        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userACookie)
            .send({ name: "INFY", qty: 5, price: 1000, mode: "BUY", orderType: "MARKET" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.order.status).toBe(ORDER_STATUS.EXECUTED);

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
    });

    test("LIMIT SELL rejected when limit price is higher than current market price", async () => {
        const currentMarketPrice = INITIAL_PRICES["INFY"] || 1555.45;
        const highLimitPrice = Number((currentMarketPrice + 5000).toFixed(2));

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

    test("User B should never see User A's orders (User Isolation)", async () => {
        const resB = await request(app)
            .get("/api/v1/orders/allOrders?page=1&limit=50")
            .set("Cookie", userBCookie);

        expect(resB.statusCode).toBe(200);
        expect(resB.body.data.every(o => o.userId.toString() === userB._id.toString())).toBe(true);
        expect(resB.body.data.some(o => o.name === "TATAPOWER")).toBe(false);
    });
});
