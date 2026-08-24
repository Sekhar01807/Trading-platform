const request = require("supertest");
const app = require("../../app");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { OrderModel } = require("../../model/OrderModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { ORDER_STATUS } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: ACID Transaction Rollback & Failure-Injection", () => {
    let testUser = null;
    let userCookie = "";

    const email = `acid_test_${Date.now()}@pulsetrade.com`;
    const password = "TradingPassword123!";

    beforeAll(async () => {
        await initTestDB();

        await request(app).post("/api/v1/auth/signup").send({ username: "AcidTrader", email, password });
        const login = await request(app).post("/api/v1/auth/login").send({ email, password });
        userCookie = login.headers["set-cookie"][0].split(";")[0];
        testUser = await User.findOne({ email });

        // Add funds and seed a holding for testing SELL rollback
        await request(app).post("/api/v1/wallet/user/funds").set("Cookie", userCookie).send({ amount: 100000, action: "ADD" });
        await HoldingModel.create({
            userId: testUser._id,
            name: "TATAPOWER",
            qty: 10,
            avg: 120,
            price: 124.15
        });
    });

    afterAll(async () => {
        if (testUser) {
            await cleanupTestUsers([testUser._id]);
        }
        await teardownTestDB();
    });

    test("BUY failure-injection should rollback funds and holdings completely", async () => {
        const userBefore = await User.findById(testUser._id);
        const initialFunds = userBefore.funds;

        // Spy and mock TransactionModel.create to throw a simulated database failure
        const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
            throw new Error("Simulated database write crash during BUY transaction");
        });

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userCookie)
            .send({ name: "RELIANCE", qty: 2, price: 2112.4, mode: "BUY", orderType: "MARKET" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);

        // 1. Verify funds were NOT deducted (rolled back 100%)
        const userAfter = await User.findById(testUser._id);
        expect(userAfter.funds).toBe(initialFunds);

        // 2. Verify RELIANCE holding was NOT created
        const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "RELIANCE" });
        expect(holdingAfter).toBeNull();

        // 3. Verify no executed order record leaked into database
        const orderCheck = await OrderModel.findOne({
            userId: testUser._id,
            name: "RELIANCE",
            status: ORDER_STATUS.EXECUTED
        });
        expect(orderCheck).toBeNull();

        spy.mockRestore();
    });

    test("SELL failure-injection should rollback holding quantity and funds completely", async () => {
        const holdingBefore = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
        expect(holdingBefore).not.toBeNull();
        const initialQty = holdingBefore.qty;

        const userBefore = await User.findById(testUser._id);
        const initialFunds = userBefore.funds;

        const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
            throw new Error("Simulated database write crash during SELL transaction");
        });

        const res = await request(app)
            .post("/api/v1/orders/newOrders")
            .set("Cookie", userCookie)
            .send({ name: "TATAPOWER", qty: 2, price: 124.15, mode: "SELL", orderType: "MARKET" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);

        // 1. Verify TATAPOWER holding quantity was NOT reduced
        const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
        expect(holdingAfter.qty).toBe(initialQty);

        // 2. Verify funds were NOT credited
        const userAfter = await User.findById(testUser._id);
        expect(userAfter.funds).toBe(initialFunds);

        spy.mockRestore();
    });

    test("Wallet deposit failure-injection should rollback funds increment completely", async () => {
        const userBefore = await User.findById(testUser._id);
        const initialFunds = userBefore.funds;

        const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
            throw new Error("Simulated database crash during Deposit ledger write");
        });

        const res = await request(app)
            .post("/api/v1/wallet/user/funds")
            .set("Cookie", userCookie)
            .send({ amount: 50000, action: "ADD" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);

        // Verify funds were NOT incremented
        const userAfter = await User.findById(testUser._id);
        expect(userAfter.funds).toBe(initialFunds);

        spy.mockRestore();
    });
});
