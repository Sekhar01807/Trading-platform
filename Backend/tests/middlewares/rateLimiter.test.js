const {
    globalRateLimiter,
    authRateLimiter,
    orderRateLimiter,
    walletRateLimiter
} = require("../../Middlewares/RateLimiter");

describe("Middleware: Sliding Window Rate Limiters", () => {
    let originalEnv;

    beforeAll(() => {
        originalEnv = process.env.NODE_ENV;
    });

    afterAll(() => {
        process.env.NODE_ENV = originalEnv;
    });

    test("should allow requests within threshold in non-test mode", () => {
        process.env.NODE_ENV = "production";

        const req = {
            ip: "192.168.1.100",
            headers: {},
            socket: {}
        };
        const res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        globalRateLimiter(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("should block and return 429 when max request limit is exceeded", () => {
        process.env.NODE_ENV = "production";

        const testLimiterKeyIp = "10.0.0.99";
        const req = {
            ip: testLimiterKeyIp,
            headers: {},
            socket: {}
        };
        const res = {
            setHeader: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        // authRateLimiter has maxRequests = 10
        for (let i = 0; i < 10; i++) {
            authRateLimiter(req, res, next);
        }
        expect(next).toHaveBeenCalledTimes(10);

        // 11th request must be rejected with 429
        authRateLimiter(req, res, next);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.setHeader).toHaveBeenCalledWith("Retry-After", expect.any(Number));
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: false,
                success: false,
                message: expect.stringContaining("Too many login/signup attempts")
            })
        );
    });

    test("should bypass limiting in NODE_ENV=test mode", () => {
        process.env.NODE_ENV = "test";

        const req = { ip: "127.0.0.1", headers: {}, socket: {} };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();

        for (let i = 0; i < 50; i++) {
            orderRateLimiter(req, res, next);
        }
        expect(next).toHaveBeenCalledTimes(50);
        expect(res.status).not.toHaveBeenCalled();
    });
});
