const AuthService = require("../../Services/AuthService");
const User = require("../../model/UserModel");
const jwt = require("jsonwebtoken");
const { getTokenSecret } = require("../../util/SecretToken");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("Domain Service: AuthService Unit Tests", () => {
    let createdUserId = null;
    const testEmail = `auth_svc_test_${Date.now()}@pulsetrade.com`;
    const rawPassword = "StrongAuthPassword123!";

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /auth_svc_test_.*@pulsetrade\.com/i });
    });

    afterAll(async () => {
        if (createdUserId) {
            await cleanupTestUsers([createdUserId]);
        }
        await teardownTestDB();
    });

    test("should reject short username or invalid email format", async () => {
        await expect(AuthService.signup({
            username: "a",
            email: testEmail,
            password: rawPassword
        })).rejects.toMatchObject({ statusCode: 400 });

        await expect(AuthService.signup({
            username: "ValidUser",
            email: "invalid-email-address",
            password: rawPassword
        })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("should reject weak password (short or no numbers/symbols)", async () => {
        await expect(AuthService.signup({
            username: "ValidUser",
            email: testEmail,
            password: "short"
        })).rejects.toMatchObject({ statusCode: 400 });

        await expect(AuthService.signup({
            username: "ValidUser",
            email: testEmail,
            password: "onlyletterslowercase"
        })).rejects.toMatchObject({ statusCode: 400 });
    });

    test("should successfully signup user and return JWT token and user info", async () => {
        const result = await AuthService.signup({
            username: "AuthSvcTrader",
            email: testEmail,
            password: rawPassword
        });

        expect(result.token).toBeDefined();
        expect(result.user.email).toBe(testEmail.toLowerCase());
        expect(result.user.username).toBe("AuthSvcTrader");
        createdUserId = result.user.id;

        const decoded = jwt.verify(result.token, getTokenSecret());
        expect(decoded.id.toString()).toBe(createdUserId.toString());
        expect(decoded.tokenVersion).toBe(0);
    });

    test("should reject duplicate signup with same email", async () => {
        await expect(AuthService.signup({
            username: "DuplicateUser",
            email: testEmail,
            password: rawPassword
        })).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("already exists") });
    });

    test("should reject login for non-existent user with generic 401", async () => {
        await expect(AuthService.login({
            email: "nonexistent_email@pulsetrade.com",
            password: rawPassword
        })).rejects.toMatchObject({ statusCode: 401, message: "Incorrect email address or password" });
    });

    test("should reject login with wrong password with generic 401", async () => {
        await expect(AuthService.login({
            email: testEmail,
            password: "WrongPassword999!"
        })).rejects.toMatchObject({ statusCode: 401, message: "Incorrect email address or password" });
    });

    test("should successfully login user with correct credentials", async () => {
        const result = await AuthService.login({
            email: testEmail,
            password: rawPassword
        });

        expect(result.token).toBeDefined();
        expect(result.user.email).toBe(testEmail.toLowerCase());
    });

    test("should update user profile bio", async () => {
        const updated = await AuthService.updateProfile(createdUserId, {
            bio: "Quantitative intraday algorithmic trader."
        });

        expect(updated.bio).toBe("Quantitative intraday algorithmic trader.");
    });

    test("signOutAllDevices should increment tokenVersion and revoke sessions", async () => {
        const userBefore = await User.findById(createdUserId);
        const versionBefore = userBefore.tokenVersion || 0;

        const res = await AuthService.signOutAllDevices(createdUserId);
        expect(res.status).toBe(true);

        const userAfter = await User.findById(createdUserId);
        expect(userAfter.tokenVersion).toBe(versionBefore + 1);
    });
});
