const router = require("express").Router();
const { getAllOrders, placeOrder } = require("../Controllers/OrderController");
const { authenticateUser } = require("../Middlewares/AuthMiddleware");

router.get("/allOrders", authenticateUser, getAllOrders);
router.post("/newOrders", authenticateUser, placeOrder);

module.exports = router;
