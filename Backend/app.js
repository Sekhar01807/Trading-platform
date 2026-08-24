require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const securityHeaders = require("./Middlewares/SecurityHeaders");
const requestLogger = require("./Middlewares/RequestLogger");
const errorHandler = require("./Middlewares/ErrorHandler");
const { globalRateLimiter } = require("./Middlewares/RateLimiter");
const { expressCorsOptions } = require("./config/corsOptions");
const { getHealthStatus } = require("./Controllers/HealthController");
const { openApiSpec, renderSwaggerHTML } = require("./docs/swagger");

// Route modules
const authRoute = require("./Routes/AuthRoute");
const orderRoute = require("./Routes/OrderRoute");
const holdingRoute = require("./Routes/HoldingRoute");
const walletRoute = require("./Routes/WalletRoute");

const app = express();

// 1. Global Security & Observability Middlewares
app.use(securityHeaders);
app.use(requestLogger);
app.use(globalRateLimiter);
app.use(cors(expressCorsOptions));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "1mb" }));

// 2. OpenAPI / Swagger Documentation Endpoints
app.get("/api-docs.json", (req, res) => res.json(openApiSpec));
app.get("/api-docs", (req, res) => res.send(renderSwaggerHTML()));

// 3. Health & System Diagnostics Endpoints
app.get("/health", getHealthStatus);
app.get("/api/v1/health", getHealthStatus);

// 4. Root API Service Status
app.get("/", (req, res) => {
    res.status(200).json({
        status: true,
        service: "PulseTrade Paper-Trading API",
        version: "1.0.0",
        documentation: "/api-docs",
        health: "/api/v1/health",
        v1BaseUrl: "/api/v1"
    });
});

// 5. Versioned API Routes (/api/v1/...)
const v1Router = express.Router();
v1Router.use("/auth", authRoute);
v1Router.use("/orders", orderRoute);
v1Router.use("/holdings", holdingRoute);
v1Router.use("/wallet", walletRoute);
v1Router.use("/health", getHealthStatus);
app.use("/api/v1", v1Router);

// 6. Backward Compatibility Root Aliases (Legacy Endpoints)
app.use("/", authRoute);
app.use("/", orderRoute);
app.use("/", holdingRoute);
app.use("/", walletRoute);

// 7. Centralized Error Handler Middleware
app.use(errorHandler);

module.exports = app;

