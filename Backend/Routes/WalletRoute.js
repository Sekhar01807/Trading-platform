const router = require("express").Router();
const {
    getFunds,
    updateFunds,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getTransactionLedger
} = require("../Controllers/WalletController");
const { authenticateUser } = require("../Middlewares/AuthMiddleware");
const { walletRateLimiter } = require("../Middlewares/RateLimiter");
const { validateRequest } = require("../Middlewares/ValidateRequest");

router.get("/user/funds", authenticateUser, getFunds);
router.post("/user/funds", authenticateUser, walletRateLimiter, validateRequest("updateFunds"), updateFunds);
router.post("/create-razorpay-order", authenticateUser, walletRateLimiter, validateRequest("createRazorpayOrder"), createRazorpayOrder);
router.post("/verify-razorpay-payment", authenticateUser, walletRateLimiter, validateRequest("verifyRazorpayPayment"), verifyRazorpayPayment);
router.get("/user/transactions", authenticateUser, getTransactionLedger);

module.exports = router;
