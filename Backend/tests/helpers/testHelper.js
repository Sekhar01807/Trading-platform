require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB, closeDB } = require("../../config/db");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { PositionModel } = require("../../model/PositionModel");
const { OrderModel } = require("../../model/OrderModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { PaymentRecordModel } = require("../../model/PaymentRecordModel");

process.env.NODE_ENV = "test";
process.env.TOKEN_KEY = process.env.TOKEN_KEY || "PulseTrade_CI_Test_JWT_Secret_Key_2026!@#";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "pulsetrade_mock_test_secret_for_hmac_signatures";

const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

/**
 * Initializes DB connection and clears any leftover test data.
 */
const initTestDB = async () => {
    await connectDB();
};

/**
 * Cleans up data associated with the given user IDs.
 */
const cleanupTestUsers = async (userIds = []) => {
    const validIds = userIds.filter(Boolean);
    if (validIds.length > 0) {
        await User.deleteMany({ _id: { $in: validIds } });
        await HoldingModel.deleteMany({ userId: { $in: validIds } });
        await PositionModel.deleteMany({ userId: { $in: validIds } });
        await OrderModel.deleteMany({ userId: { $in: validIds } });
        await TransactionModel.deleteMany({ userId: { $in: validIds } });
        await PaymentRecordModel.deleteMany({ userId: { $in: validIds } });
    }
};

/**
 * Closes MongoDB connection.
 */
const teardownTestDB = async () => {
    await closeDB();
};

module.exports = {
    RAZORPAY_SECRET,
    initTestDB,
    cleanupTestUsers,
    teardownTestDB
};
