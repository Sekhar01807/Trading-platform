/**
 * PulseTrade Database Cleaner Script
 * Cleans all collections, drops orphan legacy data, and re-syncs collection indexes.
 *
 * Usage:
 *   node scripts/cleanDB.js
 *   npm run db:clean
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../config/db");
const logger = require("../util/logger");

const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { OrderModel } = require("../model/OrderModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");

const cleanDatabase = async (disconnect = true) => {
    console.log("==================================================");
    console.log(" PulseTrade — Database Reset & Cleanup Utility");
    console.log("==================================================");

    try {
        console.log(`\n[1/4] Connecting to MongoDB (${process.env.DB_NAME || "pulsetrade"})...`);
        await connectDB();
        const db = mongoose.connection.db;

        console.log(`[2/4] Inspecting existing collections in "${mongoose.connection.name}"...`);
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collection(s):`, collections.map(c => c.name).join(", ") || "(none)");

        console.log("\n[3/4] Purging all documents from domain collections...");
        const models = [
            { name: "Users", model: User },
            { name: "Holdings", model: HoldingModel },
            { name: "Positions", model: PositionModel },
            { name: "Orders", model: OrderModel },
            { name: "Transactions", model: TransactionModel },
            { name: "Payment Records", model: PaymentRecordModel }
        ];

        for (const { name, model } of models) {
            const deleteResult = await model.deleteMany({});
            console.log(`  - Cleared ${name}: ${deleteResult.deletedCount} document(s) deleted.`);
        }

        // Also clean any legacy collections that might exist
        for (const col of collections) {
            if (!models.some(m => m.model.collection.name === col.name)) {
                console.log(`  - Dropping legacy / unmanaged collection: ${col.name}`);
                await db.dropCollection(col.name).catch(() => {});
            }
        }

        console.log("\n[4/4] Synchronizing schema indexes...");
        for (const { name, model } of models) {
            try {
                await model.syncIndexes();
                console.log(`  - Synchronized indexes for ${name}`);
            } catch (idxErr) {
                console.warn(`  - Warning syncing indexes for ${name}:`, idxErr.message);
            }
        }

        console.log("\n==================================================");
        console.log(" SUCCESS: Database is now completely CLEAN and fresh!");
        console.log("==================================================\n");

    } catch (error) {
        console.error("\n[ERROR] Database cleanup failed:", error.message);
        logger.error("Database cleanup error", { error: error.message, stack: error.stack });
        throw error;
    } finally {
        if (disconnect) {
            await closeDB();
        }
    }
};

if (require.main === module) {
    cleanDatabase(true).catch(() => process.exit(1));
}

module.exports = { cleanDatabase };
