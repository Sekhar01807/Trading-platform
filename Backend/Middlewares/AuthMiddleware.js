const User = require("../model/UserModel");
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = (req, res) => {
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(" ")[1]) || 
                  req.body.token;

    if (!token) {
        return res.json({ status: false, message: "No token provided" });
    }
    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
        if (err) {
            return res.json({ status: false, message: "Invalid token" });
        } else {
            const user = await User.findById(data.id);
            if (user) return res.json({ status: true, user: user.username, email: user.email, id: user._id });
            else return res.json({ status: false, message: "User not found" });
        }
    });
};

module.exports.authenticateUser = (req, res, next) => {
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(" ")[1]) || 
                  req.body.token;

    if (!token) {
        return res.status(401).json({ status: false, message: "Authentication required" });
    }
    jwt.verify(token, process.env.TOKEN_KEY, async (err, data) => {
        if (err) {
            return res.status(401).json({ status: false, message: "Invalid or expired token" });
        }
        try {
            const user = await User.findById(data.id);
            if (!user) {
                return res.status(401).json({ status: false, message: "User not found" });
            }
            req.user = user;
            next();
        } catch (error) {
            return res.status(500).json({ status: false, message: "Server authentication error" });
        }
    });
};
