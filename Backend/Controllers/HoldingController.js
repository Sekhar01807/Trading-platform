const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { OrderModel } = require("../model/OrderModel");
const { TransactionModel } = require("../model/TransactionModel");
const User = require("../model/UserModel");
const MarketTickerService = require("../Services/MarketTickerService");

const getAllHoldings = async (req, res, next) => {
    try {
        const userId = req.userId;
        const holdings = await HoldingModel.find({ userId });
        res.status(200).json(holdings);
    } catch (error) {
        next(error);
    }
};

const getAllPositions = async (req, res, next) => {
    try {
        const userId = req.userId;
        const positions = await PositionModel.find({ userId });
        res.status(200).json(positions);
    } catch (error) {
        next(error);
    }
};

const seedDemoData = async (req, res, next) => {
    try {
        const userId = req.userId;
        const livePrices = MarketTickerService.getLivePrices();

        await HoldingModel.deleteMany({ userId });
        await PositionModel.deleteMany({ userId });

        const defaultHoldings = [
            { userId, name: "BHARTIARTL", qty: 2, avg: 538.05, price: livePrices["BHARTIARTL"] || 541.15, net: "+0.58%", day: "+2.99%", isLoss: false },
            { userId, name: "HDFCBANK", qty: 2, avg: 1383.4, price: livePrices["HDFCBANK"] || 1522.35, net: "+10.04%", day: "+0.11%", isLoss: false },
            { userId, name: "HINDUNILVR", qty: 1, avg: 2335.85, price: livePrices["HINDUNILVR"] || 2417.4, net: "+3.49%", day: "+0.21%", isLoss: false },
            { userId, name: "INFY", qty: 1, avg: 1350.5, price: livePrices["INFY"] || 1555.45, net: "+15.18%", day: "-1.60%", isLoss: true },
            { userId, name: "ITC", qty: 5, avg: 202.0, price: livePrices["ITC"] || 207.9, net: "+2.92%", day: "+0.80%", isLoss: false },
            { userId, name: "KPITTECH", qty: 5, avg: 250.3, price: livePrices["KPITTECH"] || 266.45, net: "+6.45%", day: "+3.54%", isLoss: false },
            { userId, name: "M&M", qty: 2, avg: 809.9, price: livePrices["M&M"] || 779.8, net: "-3.72%", day: "-0.01%", isLoss: true },
            { userId, name: "RELIANCE", qty: 1, avg: 2193.7, price: livePrices["RELIANCE"] || 2112.4, net: "-3.71%", day: "+1.44%", isLoss: false },
            { userId, name: "SBIN", qty: 4, avg: 324.35, price: livePrices["SBIN"] || 430.2, net: "+32.63%", day: "-0.34%", isLoss: true },
            { userId, name: "TATAPOWER", qty: 5, avg: 104.2, price: livePrices["TATAPOWER"] || 124.15, net: "+19.15%", day: "-0.24%", isLoss: true },
            { userId, name: "TCS", qty: 1, avg: 3041.7, price: livePrices["TCS"] || 3194.8, net: "+5.03%", day: "-0.25%", isLoss: true },
            { userId, name: "WIPRO", qty: 4, avg: 489.3, price: livePrices["WIPRO"] || 577.75, net: "+18.08%", day: "+0.32%", isLoss: false }
        ];

        const defaultPositions = [
            { userId, product: "CNC", name: "EVEREADY", qty: 2, avg: 316.27, price: livePrices["EVEREADY"] || 312.35, net: "+0.58%", day: "-1.24%", isLoss: true },
            { userId, product: "CNC", name: "JUBLFOOD", qty: 1, avg: 3124.75, price: livePrices["JUBLFOOD"] || 3082.65, net: "+10.04%", day: "-1.35%", isLoss: true }
        ];

        const seededHoldings = await HoldingModel.insertMany(defaultHoldings);
        const seededPositions = await PositionModel.insertMany(defaultPositions);
        await User.findByIdAndUpdate(userId, { funds: 50000 });

        res.status(200).json({
            success: true,
            message: "Demo portfolio loaded successfully with ₹50,000 test balance!",
            holdings: seededHoldings,
            positions: seededPositions
        });
    } catch (error) {
        next(error);
    }
};

const resetPortfolio = async (req, res, next) => {
    try {
        const userId = req.userId;
        await HoldingModel.deleteMany({ userId });
        await PositionModel.deleteMany({ userId });
        await OrderModel.deleteMany({ userId });
        await TransactionModel.deleteMany({ userId });
        await User.findByIdAndUpdate(userId, { funds: 0 });

        res.status(200).json({
            success: true,
            message: "Portfolio, orders, and funds reset to clean state (₹0.00 balance)."
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllHoldings,
    getAllPositions,
    seedDemoData,
    resetPortfolio
};
