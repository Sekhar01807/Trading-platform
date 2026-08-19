const router = require("express").Router();
const { Signup, Login, Logout, LogoutAll, UpdateProfile, ChangePassword, DeleteAccount } = require("../Controllers/AuthController");
const { userVerification, authenticateUser } = require("../Middlewares/AuthMiddleware");
const { authRateLimiter } = require("../Middlewares/RateLimiter");
const { validateRequest } = require("../Middlewares/ValidateRequest");

router.post("/signup", authRateLimiter, validateRequest("signup"), Signup);
router.post("/login", authRateLimiter, validateRequest("login"), Login);
router.post("/logout", Logout);
router.post("/logout-all", authenticateUser, LogoutAll);
router.post("/updateProfile", authenticateUser, UpdateProfile);
router.post("/change-password", authenticateUser, authRateLimiter, validateRequest("changePassword"), ChangePassword);
router.post("/delete-account", authenticateUser, authRateLimiter, validateRequest("deleteAccount"), DeleteAccount);
router.post("/", userVerification);

module.exports = router;

