const router = require("express").Router();
const { getAllHoldings, getAllPositions, seedDemoData, resetPortfolio } = require("../Controllers/HoldingController");
const { authenticateUser } = require("../Middlewares/AuthMiddleware");

router.get("/allHoldings", authenticateUser, getAllHoldings);
router.get("/allPositions", authenticateUser, getAllPositions);
router.post("/seedDemoData", authenticateUser, seedDemoData);
router.delete("/resetPortfolio", authenticateUser, resetPortfolio);

module.exports = router;
