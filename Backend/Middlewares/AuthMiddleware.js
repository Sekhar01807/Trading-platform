const User = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const { getTokenSecret } = require("../util/SecretToken");

const extractToken = (req) => {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(" ");
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            return parts[1];
        }
    }
    if (req.body && req.body.token) {
        return req.body.token;
    }
    return null;
};

const getUserIdFromReq = (req) => {
    const token = extractToken(req);
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, getTokenSecret());
        return decoded.id;
    } catch (err) {
        return null;
    }
};

const authenticateUser = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ 
            status: false, 
            message: "Unauthorized access: Please log in." 
        });
    }

    try {
        const decoded = jwt.verify(token, getTokenSecret());
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ 
                status: false, 
                message: "User session expired or user no longer exists." 
            });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: false, 
            message: "Invalid or expired token. Please log in again." 
        });
    }
};

const userVerification = async (req, res) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ status: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, getTokenSecret());
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ status: false, message: "User not found" });
        }

        return res.status(200).json({ 
            status: true, 
            user: user.username, 
            email: user.email, 
            phone: user.phone || "", 
            bio: user.bio || "", 
            funds: user.funds || 0,
            id: user._id, 
            createdAt: user.createdAt 
        });
    } catch (err) {
        return res.status(401).json({ status: false, message: "Invalid or expired token" });
    }
};

module.exports = {
    extractToken,
    getUserIdFromReq,
    authenticateUser,
    userVerification
};
