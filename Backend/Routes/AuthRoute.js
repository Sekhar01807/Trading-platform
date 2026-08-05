const { Signup, Login, UpdateProfile } = require("../Controllers/AuthController");
const { userVerification } = require("../Middlewares/AuthMiddleware");
const router = require("express").Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/updateProfile", UpdateProfile);
router.post('/', userVerification)

module.exports = router;

