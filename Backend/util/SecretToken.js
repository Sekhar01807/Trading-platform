require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("./logger");

const getTokenSecret = () => {
    const secret = process.env.TOKEN_KEY;
    if (!secret || secret.trim().length < 16) {
        if (process.env.NODE_ENV === "production") {
            logger.error("CRITICAL: TOKEN_KEY is missing or weak in production environment!");
            throw new Error("Secure TOKEN_KEY environment variable is required.");
        }
        logger.warn("Warning: Using default development JWT secret key.");
        return secret || "PulseTrade_Dev_Secret_Token_Key_2026!@#$";
    }
    return secret;
};

module.exports.createSecretToken = (id) => {
    const secret = getTokenSecret();
    return jwt.sign({ id }, secret, {
        expiresIn: 3 * 24 * 60 * 60, // 3 days
    });
};

module.exports.getTokenSecret = getTokenSecret;
