const router = require("express").Router();
const { Signup, Login, Logout, UpdateProfile } = require("../Controllers/AuthController");
const { userVerification, authenticateUser } = require("../Middlewares/AuthMiddleware");
const { authRateLimiter } = require("../Middlewares/RateLimiter");
const { validateRequest } = require("../Middlewares/ValidateRequest");

router.post("/signup", authRateLimiter, validateRequest("signup"), Signup);
router.post("/login", authRateLimiter, validateRequest("login"), Login);
router.post("/logout", Logout);
router.post("/updateProfile", authenticateUser, UpdateProfile);
router.post("/", userVerification);

module.exports = router;
