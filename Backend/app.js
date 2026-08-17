require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const securityHeaders = require("./Middlewares/SecurityHeaders");
const errorHandler = require("./Middlewares/ErrorHandler");
const { expressCorsOptions } = require("./config/corsOptions");

// Route modules
const authRoute = require("./Routes/AuthRoute");
const orderRoute = require("./Routes/OrderRoute");
const holdingRoute = require("./Routes/HoldingRoute");
const walletRoute = require("./Routes/WalletRoute");

const app = express();

// Global Middlewares
app.use(securityHeaders);
app.use(cors(expressCorsOptions));
app.use(cookieParser());
app.use(bodyParser.json());

// Root API Health & Diagnostic Endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        status: true,
        message: "PulseTrade Backend API is running successfully!"
    });
});

// Mount Routes
app.use("/", authRoute);
app.use("/", orderRoute);
app.use("/", holdingRoute);
app.use("/", walletRoute);

// Centralized Error Handler Middleware
app.use(errorHandler);

module.exports = app;
