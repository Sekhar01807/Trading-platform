require("dotenv").config();
const jwt = require("jsonwebtoken");
const logger = require("./logger");

const getTokenSecret = () => {
    const secret = process.env.TOKEN_KEY;
    if (!secret || secret.trim().length < 16) {
        logger.error("CRITICAL: Secure TOKEN_KEY environment variable (min 16 characters) is required.");
        throw new Error("Secure TOKEN_KEY environment variable is required.");
    }
    return secret.trim();
};

module.exports.createSecretToken = (id, tokenVersion = 0) => {
    const secret = getTokenSecret();
    return jwt.sign({ id, tokenVersion }, secret, {
        expiresIn: 3 * 24 * 60 * 60, // 3 days
    });
};

module.exports.getTokenSecret = getTokenSecret;
