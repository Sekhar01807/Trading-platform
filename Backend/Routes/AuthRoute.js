const router = require("express").Router();
const { Signup, Login, Logout, UpdateProfile } = require("../Controllers/AuthController");
const { userVerification, authenticateUser } = require("../Middlewares/AuthMiddleware");
const authRateLimiter = require("../Middlewares/RateLimiter");

router.post("/signup", authRateLimiter, Signup);
router.post("/login", authRateLimiter, Login);
router.post("/logout", Logout);
router.post("/updateProfile", authenticateUser, UpdateProfile);
router.post("/", userVerification);

module.exports = router;
