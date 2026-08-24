const request = require("supertest");
const app = require("../../app");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { PositionModel } = require("../../model/PositionModel");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: Holdings, Positions & Backward Compatibility", () => {
    let userA = null;
    let userACookie = "";
    let userB = null;
    let userBCookie = "";

    const emailA = `holdings_test_a_${Date.now()}@pulsetrade.com`;
    const emailB = `holdings_test_b_${Date.now()}@pulsetrade.com`;
    const password = "TradingPassword123!";

    beforeAll(async () => {
        await initTestDB();

        // User A
        await request(app).post("/api/v1/auth/signup").send({ username: "HoldingTraderA", email: emailA, password });
        const loginA = await request(app).post("/api/v1/auth/login").send({ email: emailA, password });
        userACookie = loginA.headers["set-cookie"][0].split(";")[0];
        userA = await User.findOne({ email: emailA });

        // User B
        await request(app).post("/api/v1/auth/signup").send({ username: "HoldingTraderB", email: emailB, password });
        const loginB = await request(app).post("/api/v1/auth/login").send({ email: emailB, password });
        userBCookie = loginB.headers["set-cookie"][0].split(";")[0];
        userB = await User.findOne({ email: emailB });

        // Seed holdings directly for testing isolation
        await HoldingModel.create({
            userId: userA._id,
            name: "TATAPOWER",
            qty: 10,
            avg: 120,
            price: 124
        });

        await HoldingModel.create({
            userId: userB._id,
            name: "WIPRO",
            qty: 5,
            avg: 500,
            price: 520
        });

        await PositionModel.create({
            userId: userA._id,
            product: "CNC",
            name: "EVEREADY",
            qty: 2,
            avg: 316.27,
            price: 312.35
        });
    });

    afterAll(async () => {
        const userIds = [userA?._id, userB?._id].filter(Boolean);
        await cleanupTestUsers(userIds);
        await teardownTestDB();
    });

    test("GET /api/v1/holdings/allHoldings returns user's holdings", async () => {
        const res = await request(app)
            .get("/api/v1/holdings/allHoldings")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(h => h.name === "TATAPOWER")).toBe(true);
        expect(res.body.every(h => h.userId.toString() === userA._id.toString())).toBe(true);
    });

    test("GET /api/v1/holdings/allPositions returns user's positions", async () => {
        const res = await request(app)
            .get("/api/v1/holdings/allPositions")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(p => p.name === "EVEREADY")).toBe(true);
    });

    test("User B should not see User A's holdings in /allHoldings", async () => {
        const resB = await request(app)
            .get("/api/v1/holdings/allHoldings")
            .set("Cookie", userBCookie);

        expect(resB.statusCode).toBe(200);
        expect(resB.body.every(h => h.userId.toString() === userB._id.toString())).toBe(true);
        expect(resB.body.some(h => h.name === "TATAPOWER")).toBe(false);
        expect(resB.body.some(h => h.name === "WIPRO")).toBe(true);
    });

    test("GET /allHoldings backward compatibility root alias", async () => {
        const res = await request(app)
            .get("/allHoldings")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("GET /allPositions backward compatibility root alias", async () => {
        const res = await request(app)
            .get("/allPositions")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("GET /user/funds backward compatibility root alias", async () => {
        const res = await request(app)
            .get("/user/funds")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.totalAddedFunds).toBeDefined();
    });
});
