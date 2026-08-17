const logger = require("../util/logger");

const errorHandler = (err, req, res, next) => {
    logger.error("Unhandled API Error", {
        method: req.method,
        url: req.originalUrl,
        error: err.message || err,
        statusCode: err.statusCode
    });

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            status: false,
            message: "Not allowed by CORS policy."
        });
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        return res.status(409).json({
            status: false,
            message: "Resource conflict: A record with this unique identifier already exists."
        });
    }

    // Mongoose Validation or Cast Error (e.g. invalid ObjectId)
    if (err.name === "ValidationError" || err.name === "CastError") {
        return res.status(400).json({
            status: false,
            message: err.message || "Invalid input data format."
        });
    }

    // JWT Error
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            status: false,
            message: "Session expired or invalid authentication token."
        });
    }

    const statusCode = err.statusCode || (res.statusCode !== 200 && res.statusCode !== 201 ? res.statusCode : 500);
    const userMessage = statusCode === 500 && process.env.NODE_ENV === "production"
        ? "An internal server error occurred. Please try again later."
        : (err.message || "Internal Server Error");

    res.status(statusCode).json({
        status: false,
        message: userMessage,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = errorHandler;
