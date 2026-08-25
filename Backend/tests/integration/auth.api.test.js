const request = require("supertest");
const app = require("../../app");
const User = require("../../model/UserModel");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("API Integration: Authentication, Sessions & Security", () => {
    let userA = null;
    let userACookie = "";

    const emailA = `auth_test_user_${Date.now()}@pulsetrade.com`;
    const rawPassword = "StrongTradingPassword123!";

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /auth_test_.*@pulsetrade\.com/i });
    });

    afterAll(async () => {
        if (userA) {
            await cleanupTestUsers([userA._id]);
        }
        await teardownTestDB();
    });

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

    test("Signup should register User with HttpOnly cookie and ZERO token in JSON", async () => {
        const res = await request(app)
            .post("/api/v1/auth/signup")
            .send({ username: "TraderAuthA", email: emailA, password: rawPassword });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.user.username).toBe("TraderAuthA");
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

    test("Login should authenticate User and issue session cookie", async () => {
        const res = await request(app)
            .post("/api/v1/auth/login")
            .send({ email: emailA, password: rawPassword });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        const setCookie = res.headers["set-cookie"];
        userACookie = Array.isArray(setCookie) ? setCookie[0].split(";")[0] : setCookie.split(";")[0];
        expect(userACookie).toContain("token=");
    });

    test("Update profile should require authentication and update bio", async () => {
        const res = await request(app)
            .post("/api/v1/auth/updateProfile")
            .set("Cookie", userACookie)
            .send({ bio: "Paper trader experimenting with quantitative swing strategies." });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.bio).toContain("Paper trader");
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

        // Verify cookie works
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

        const revokeUser = await User.findOne({ email: revocationEmail });
        if (revokeUser) {
            await cleanupTestUsers([revokeUser._id]);
        }
    });

    test("POST /logout should clear session cookie", async () => {
        const res = await request(app)
            .post("/api/v1/auth/logout")
            .set("Cookie", userACookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
