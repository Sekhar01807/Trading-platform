const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

    if (err.message === "Not allowed by CORS") {
        return res.status(500).json({
            status: false,
            message: "Not allowed by CORS"
        });
    }

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    res.status(statusCode).json({
        status: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = errorHandler;
