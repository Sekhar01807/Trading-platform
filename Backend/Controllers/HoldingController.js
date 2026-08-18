const HoldingService = require("../Services/HoldingService");

const getAllHoldings = async (req, res, next) => {
    try {
        const userId = req.userId;
        const holdings = await HoldingService.getHoldings(userId);
        res.status(200).json(holdings);
    } catch (error) {
        next(error);
    }
};

const getAllPositions = async (req, res, next) => {
    try {
        const userId = req.userId;
        const positions = await HoldingService.getPositions(userId);
        res.status(200).json(positions);
    } catch (error) {
        next(error);
    }
};

const seedDemoData = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
            return res.status(403).json({
                success: false,
                message: "Demo portfolio seeding is disabled in production mode."
            });
        }

        const userId = req.userId;
        const result = await HoldingService.seedDemoData(userId);

        res.status(200).json({
            success: true,
            message: "Demo portfolio loaded successfully with ₹50,000 test balance!",
            holdings: result.holdings,
            positions: result.positions
        });
    } catch (error) {
        next(error);
    }
};

const resetPortfolio = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
            return res.status(403).json({
                success: false,
                message: "Portfolio reset is disabled in production mode."
            });
        }

        const userId = req.userId;
        const result = await HoldingService.resetPortfolio(userId);

        res.status(200).json({
            success: true,
            message: result.message
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
