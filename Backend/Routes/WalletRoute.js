const router = require("express").Router();
const {
    getFunds,
    updateFunds,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getTransactionLedger
} = require("../Controllers/WalletController");
const { authenticateUser } = require("../Middlewares/AuthMiddleware");

router.get("/user/funds", authenticateUser, getFunds);
router.post("/user/funds", authenticateUser, updateFunds);
router.post("/create-razorpay-order", authenticateUser, createRazorpayOrder);
router.post("/verify-razorpay-payment", authenticateUser, verifyRazorpayPayment);
router.get("/user/transactions", authenticateUser, getTransactionLedger);

module.exports = router;
