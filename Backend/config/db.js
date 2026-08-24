const mongoose = require("mongoose");
const logger = require("../util/logger");

let isConnecting = false;

const setupMongooseEvents = () => {
    mongoose.connection.on("connected", () => {
        logger.info("[MongoDB] Connection established successfully.", {
            db: mongoose.connection.name,
            host: mongoose.connection.host
        });
    });

    mongoose.connection.on("error", (err) => {
        logger.error("[MongoDB] Connection error occurred:", { error: err.message });
    });

    mongoose.connection.on("disconnected", () => {
        logger.warn("[MongoDB] Connection lost. Attempting auto-reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
        logger.info("[MongoDB] Connection re-established.");
    });
};

const connectDB = async (url) => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (isConnecting) {
        return mongoose.connection;
    }

    const dbUri = url || process.env.ATLASDB_URL || (process.env.NODE_ENV === "test" ? "mongodb://127.0.0.1:27017/pulsetrade_test?replicaSet=rs0&directConnection=true" : null);

    if (!dbUri) {
        const errMsg = "MongoDB connection string (ATLASDB_URL) is not configured.";
        logger.error("[MongoDB] " + errMsg);
        if (process.env.NODE_ENV !== "test") {
            process.exit(1);
        }
        throw new Error(errMsg);
    }

    try {
        isConnecting = true;
        setupMongooseEvents();

        const conn = await mongoose.connect(dbUri, {
            dbName: process.env.DB_NAME || "pulsetrade",
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 50
        });

        try {
            const { PaymentRecordModel } = require("../model/PaymentRecordModel");
            await PaymentRecordModel.syncIndexes();
        } catch (idxErr) {
            logger.warn("[MongoDB] Index synchronization warning:", { message: idxErr.message });
        }

        isConnecting = false;
        return conn;

    } catch (error) {
        isConnecting = false;
        logger.error("[MongoDB] Failed to connect to database:", { error: error.message });
        if (process.env.NODE_ENV !== "test") {
            process.exit(1);
        }
        throw error;
    }
};

const closeDB = async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close(false);
            logger.info("[MongoDB] Connection closed gracefully.");
        }
    } catch (error) {
        logger.error("[MongoDB] Error closing database connection:", { error: error.message });
    }
};

module.exports = { connectDB, closeDB };
