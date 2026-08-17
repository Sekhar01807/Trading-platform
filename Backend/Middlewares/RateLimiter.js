// Sliding Window Layered Rate Limiters for PulseTrade Enterprise Security

const createSlidingWindowLimiter = ({ windowMs, maxRequests, message }) => {
    const rateLimitMap = new Map();

    return (req, res, next) => {
        if (process.env.NODE_ENV === "test") {
            return next();
        }

        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
        const key = req.userId ? `${ip}_user_${req.userId}` : ip;
        const now = Date.now();

        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, []);
        }

        const timestamps = rateLimitMap.get(key).filter(t => now - t < windowMs);
        timestamps.push(now);
        rateLimitMap.set(key, timestamps);

        if (timestamps.length > maxRequests) {
            const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
            res.setHeader("Retry-After", retryAfterSeconds);
            return res.status(429).json({
                status: false,
                success: false,
                message: message || "Too many requests. Please slow down.",
                retryAfterSeconds
            });
        }
        next();
    };
};

// Global API Limiter: 300 requests / 15 mins per IP
const globalRateLimiter = createSlidingWindowLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 300,
    message: "Too many overall requests to PulseTrade API. Please slow down."
});

// Authentication Limiter: 20 login/signup attempts / 15 mins per IP
const authRateLimiter = createSlidingWindowLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    message: "Too many login/signup attempts. Please try again after 15 minutes."
});

// Trading Order Placement Limiter: 30 orders / 1 min per user/IP
const orderRateLimiter = createSlidingWindowLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: "Order rate limit exceeded. Maximum 30 orders per minute."
});

// Wallet / Payment Action Limiter: 15 actions / 1 min per user/IP
const walletRateLimiter = createSlidingWindowLimiter({
    windowMs: 60 * 1000,
    maxRequests: 15,
    message: "Wallet action rate limit exceeded. Please wait a moment before trying again."
});

module.exports = {
    globalRateLimiter,
    authRateLimiter,
    orderRateLimiter,
    walletRateLimiter
};
