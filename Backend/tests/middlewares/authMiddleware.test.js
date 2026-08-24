const { authenticateUser, userVerification } = require("../../Middlewares/AuthMiddleware");
const User = require("../../model/UserModel");
const { createSecretToken } = require("../../util/SecretToken");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("Middleware: AuthMiddleware Token Verification & Revocation", () => {
    let testUser = null;
    const testEmail = `auth_mid_test_${Date.now()}@pulsetrade.com`;

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /auth_mid_.*@pulsetrade\.com/i });

        testUser = await User.create({
            username: "AuthMidTrader",
            email: testEmail,
            password: "HashedPassword123!",
            tokenVersion: 0,
            funds: 1000
        });
    });

    afterAll(async () => {
        if (testUser) {
            await cleanupTestUsers([testUser._id]);
        }
        await teardownTestDB();
    });

    test("authenticateUser should return 401 when no token is present", async () => {
        const req = { cookies: {}, headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await authenticateUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("authenticateUser should return 401 on tampered/invalid token", async () => {
        const req = { cookies: { token: "tampered.jwt.token" }, headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await authenticateUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("authenticateUser should allow valid Bearer token and attach user to req", async () => {
        const token = createSecretToken(testUser._id, 0);
        const req = {
            cookies: {},
            headers: { authorization: `Bearer ${token}` }
        };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await authenticateUser(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.user).toBeDefined();
        expect(req.userId.toString()).toBe(testUser._id.toString());
    });

    test("authenticateUser should reject session if tokenVersion is outdated (revocation check)", async () => {
        // Old token with tokenVersion: 0
        const oldToken = createSecretToken(testUser._id, 0);

        // Simulate revocation by bumping tokenVersion to 1
        await User.findByIdAndUpdate(testUser._id, { tokenVersion: 1 });

        const req = { cookies: { token: oldToken }, headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        await authenticateUser(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: false,
                message: expect.stringContaining("Session has been revoked")
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test("userVerification should return 200 with user data for valid token", async () => {
        // Generate new token with current tokenVersion: 1
        const freshToken = createSecretToken(testUser._id, 1);
        const req = { cookies: { token: freshToken }, headers: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        await userVerification(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: true,
                user: "AuthMidTrader"
            })
        );
    });
});
