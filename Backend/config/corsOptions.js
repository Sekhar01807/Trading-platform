const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.DASHBOARD_URL,
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
    "http://localhost:5173",
    "http://localhost:5174"
].filter(Boolean);

const corsOriginHandler = (origin, callback) => {
    // Allow non-browser tools (e.g. mobile apps, postman, curl) when origin is undefined
    if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
};

const expressCorsOptions = {
    origin: corsOriginHandler,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

const socketCorsOptions = {
    origin: corsOriginHandler,
    methods: ["GET", "POST"],
    credentials: true
};

module.exports = {
    allowedOrigins,
    corsOriginHandler,
    expressCorsOptions,
    socketCorsOptions
};
