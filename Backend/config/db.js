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

const connectDB = async (url = process.env.ATLASDB_URL) => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (isConnecting) {
        return mongoose.connection;
    }

    try {
        isConnecting = true;
        setupMongooseEvents();

        const conn = await mongoose.connect(url, {
            dbName: "zerodha",
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 50
        });

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
