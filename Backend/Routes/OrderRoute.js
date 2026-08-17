const router = require("express").Router();
const { getAllOrders, placeOrder } = require("../Controllers/OrderController");
const { authenticateUser } = require("../Middlewares/AuthMiddleware");
const { orderRateLimiter } = require("../Middlewares/RateLimiter");
const { validateRequest } = require("../Middlewares/ValidateRequest");

router.get("/allOrders", authenticateUser, getAllOrders);
router.post("/newOrders", authenticateUser, orderRateLimiter, validateRequest("placeOrder"), placeOrder);

module.exports = router;
