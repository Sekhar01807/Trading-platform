// Sliding Window Rate Limiter for Authentication Endpoints (Brute-force protection)
const rateLimitMap = new Map();

const authRateLimiter = (req, res, next) => {
    // In test environment, do not throttle requests to allow fast test execution
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15-minute sliding window
    const maxRequests = 20; // Maximum 20 attempts per window

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    if (timestamps.length > maxRequests) {
        return res.status(429).json({
            status: false,
            message: "Too many login/signup attempts. Please try again after 15 minutes."
        });
    }
    next();
};

module.exports = authRateLimiter;
