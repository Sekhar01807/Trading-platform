/**
 * PulseTrade Fresh Database Seeder Script
 * Cleans the entire database and creates a ready-to-use demo account with ₹50,000 margin & 12 holdings.
 *
 * Usage:
 *   node scripts/seedFreshDB.js
 *   npm run db:fresh
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { connectDB, closeDB } = require("../config/db");
const logger = require("../util/logger");

const User = require("../model/UserModel");
const HoldingService = require("../Services/HoldingService");
const { cleanDatabase } = require("./cleanDB");

const seedFreshDatabase = async () => {
    console.log("==================================================");
    console.log(" PulseTrade — Fresh Database & Demo Data Seeder");
    console.log("==================================================");

    try {
        // 1. Clean entire database first (keep connection alive)
        console.log("\n[Step 1] Wiping existing database records...");
        await cleanDatabase(false);

        // 2. Ensure connection is active
        await connectDB();

        // 3. Create Default Demo Account
        console.log("\n[Step 2] Creating Default Demo User Account...");
        const demoEmail = process.env.DEMO_USER_EMAIL || "demo@pulsetrade.com";
        const demoPassword = process.env.DEMO_USER_PASSWORD || "DemoPassword123!";
        const demoUsername = "DemoTrader";

        const demoUser = await User.create({
            email: demoEmail,
            username: demoUsername,
            password: demoPassword,
            phone: "+91 98765 43210",
            bio: "PulseTrade Demo Portfolio Account",
            funds: 50000
        });

        console.log(`  - Demo user created successfully (ID: ${demoUser._id})`);

        // 4. Seed Demo Portfolio (12 NSE stocks + 2 intraday positions)
        console.log("\n[Step 3] Seeding demo equity holdings and positions...");
        const seeded = await HoldingService.seedDemoData(demoUser._id);

        console.log(`  - Seeded ${seeded.holdings.length} NSE equity holdings`);
        console.log(`  - Seeded ${seeded.positions.length} intraday positions`);
        console.log(`  - Wallet Balance: ₹50,000.00 cash margin`);

        console.log("\n==================================================");
        console.log(" SUCCESS: Fresh Database Initialized!");
        console.log("==================================================");
        console.log("Demo Account Credentials:");
        console.log(`  • Email:    ${demoEmail}`);
        console.log(`  • Password: ${demoPassword}`);
        console.log(`  • Funds:    ₹50,000.00`);
        console.log("==================================================\n");

    } catch (error) {
        console.error("\n[ERROR] Fresh database setup failed:", error.message);
        logger.error("Fresh database setup error", { error: error.message, stack: error.stack });
        process.exitCode = 1;
    } finally {
        await closeDB();
    }
};

if (require.main === module) {
    seedFreshDatabase();
}

module.exports = { seedFreshDatabase };
