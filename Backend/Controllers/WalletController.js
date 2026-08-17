const WalletService = require("../Services/WalletService");

const getFunds = async (req, res, next) => {
    try {
        const userId = req.userId;
        const fundsData = await WalletService.getFundsSummary(userId);
        res.status(200).json(fundsData);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ status: false, message: error.message });
        }
        next(error);
    }
};

const updateFunds = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { amount, action } = req.body;
        const result = await WalletService.updateFunds(userId, amount, action);
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ status: false, message: error.message });
        }
        next(error);
    }
};

const createRazorpayOrder = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { amount } = req.body;
        const result = await WalletService.createRazorpayOrder(userId, amount);
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ status: false, message: error.message });
        }
        next(error);
    }
};

const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await WalletService.verifyRazorpayPayment(userId, req.body);
        res.status(200).json(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ status: false, message: error.message });
        }
        next(error);
    }
};

const getTransactionLedger = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await WalletService.getTransactionHistory(userId, req.query);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFunds,
    updateFunds,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getTransactionLedger
};
