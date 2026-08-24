const HoldingService = require("../../Services/HoldingService");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { PositionModel } = require("../../model/PositionModel");
const { OrderModel } = require("../../model/OrderModel");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("Domain Service: HoldingService (Seeding & Portfolio Queries)", () => {
    let testUser = null;
    const testEmail = `holding_svc_test_${Date.now()}@pulsetrade.com`;

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /holding_svc_test_.*@pulsetrade\.com/i });

        testUser = await User.create({
            username: "HoldingSvcTrader",
            email: testEmail,
            password: "HashedPassword123!",
            funds: 0
        });
    });

    afterAll(async () => {
        if (testUser) {
            await cleanupTestUsers([testUser._id]);
        }
        await teardownTestDB();
    });

    test("seedDemoData should populate 12 holdings, 2 positions, and set funds to ₹50,000", async () => {
        const result = await HoldingService.seedDemoData(testUser._id);

        expect(result.holdings.length).toBe(12);
        expect(result.positions.length).toBe(2);

        const holdingsInDb = await HoldingModel.find({ userId: testUser._id });
        expect(holdingsInDb.length).toBe(12);

        const positionsInDb = await PositionModel.find({ userId: testUser._id });
        expect(positionsInDb.length).toBe(2);

        const user = await User.findById(testUser._id);
        expect(user.funds).toBe(50000);
    });

    test("getHoldings should retrieve user's seeded holdings", async () => {
        const holdings = await HoldingService.getHoldings(testUser._id);
        expect(holdings.length).toBe(12);
        expect(holdings.some(h => h.name === "INFY")).toBe(true);
    });

    test("getPositions should retrieve user's seeded positions", async () => {
        const positions = await HoldingService.getPositions(testUser._id);
        expect(positions.length).toBe(2);
        expect(positions.some(p => p.name === "EVEREADY")).toBe(true);
    });

    test("resetPortfolio should wipe holdings, positions, orders, and reset funds to 0", async () => {
        // Create a dummy order
        await OrderModel.create({
            userId: testUser._id,
            name: "INFY",
            qty: 1,
            price: 1500,
            mode: "BUY",
            status: "EXECUTED"
        });

        const resetRes = await HoldingService.resetPortfolio(testUser._id);
        expect(resetRes.message).toContain("reset to clean state");

        const holdings = await HoldingModel.find({ userId: testUser._id });
        expect(holdings.length).toBe(0);

        const positions = await PositionModel.find({ userId: testUser._id });
        expect(positions.length).toBe(0);

        const orders = await OrderModel.find({ userId: testUser._id });
        expect(orders.length).toBe(0);

        const user = await User.findById(testUser._id);
        expect(user.funds).toBe(0);
    });
});
