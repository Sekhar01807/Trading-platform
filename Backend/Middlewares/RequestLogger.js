const crypto = require("crypto");
const logger = require("../util/logger");

const requestLogger = (req, res, next) => {
    const startTime = process.hrtime();
    const requestId = req.headers["x-request-id"] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    res.on("finish", () => {
        const diff = process.hrtime(startTime);
        const latencyMs = Number((diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2));
        const statusCode = res.statusCode;

        // Skip logging test health-checks in test mode unless debug is set
        if (process.env.NODE_ENV === "test" && req.path === "/health") {
            return;
        }

        const logContext = {
            requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode,
            latencyMs,
            ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1",
            userAgent: req.headers["user-agent"] || "unknown",
            ...(req.userId && { userId: req.userId.toString() })
        };

        if (statusCode >= 500) {
            logger.error(`HTTP ${req.method} ${req.originalUrl} failed with ${statusCode}`, logContext);
        } else if (statusCode >= 400) {
            logger.warn(`HTTP ${req.method} ${req.originalUrl} responded with ${statusCode}`, logContext);
        } else {
            logger.info(`HTTP ${req.method} ${req.originalUrl} completed with ${statusCode}`, logContext);
        }
    });

    next();
};

module.exports = requestLogger;
