const mongoose = require("mongoose");

const connectDB = async (url = process.env.ATLASDB_URL) => {
    try {
        if (mongoose.connection.readyState >= 1) {
            return mongoose.connection;
        }

        const conn = await mongoose.connect(url, {
            dbName: "zerodha"
        });

        console.log(`[MongoDB] Connected successfully to database: ${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error("[MongoDB] Connection failed:", error.message);
        if (process.env.NODE_ENV !== "test") {
            process.exit(1);
        }
        throw error;
    }
};

const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log("[MongoDB] Connection closed successfully.");
    } catch (error) {
        console.error("[MongoDB] Error closing database connection:", error.message);
    }
};

module.exports = { connectDB, closeDB };
