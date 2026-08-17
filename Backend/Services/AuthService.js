const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");
const logger = require("../util/logger");

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && emailRegex.test(email.trim());
};

const isStrongPassword = (password) => {
    // Minimum 8 characters, at least one letter and at least one number or special character
    return typeof password === "string" && password.length >= 8 && /[a-zA-Z]/.test(password) && /[\d\W]/.test(password);
};

class AuthService {
    /**
     * Registers a new user account with password hashing and validation.
     */
    static async signup({ username, email, password, createdAt }) {
        if (!username || typeof username !== "string" || username.trim().length < 2 || username.trim().length > 30) {
            throw { statusCode: 400, message: "Username must be between 2 and 30 characters long" };
        }

        if (!isValidEmail(email)) {
            throw { statusCode: 400, message: "Please provide a valid email address" };
        }

        if (!password || typeof password !== "string" || password.length < 8) {
            throw { statusCode: 400, message: "Password must be at least 8 characters long" };
        }

        if (!isStrongPassword(password)) {
            throw { statusCode: 400, message: "Password must contain both letters and numbers/symbols" };
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedUsername = username.trim();

        const existingUser = await User.findOne({ email: sanitizedEmail });
        if (existingUser) {
            logger.warn("Signup attempt with duplicate email", { email: sanitizedEmail });
            throw { statusCode: 400, message: "An account with this email address already exists" };
        }

        const user = await User.create({
            email: sanitizedEmail,
            password,
            username: sanitizedUsername,
            createdAt: createdAt || new Date()
        });

        const token = createSecretToken(user._id);

        logger.info("User registered successfully", { userId: user._id, email: sanitizedEmail });

        return {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                funds: user.funds || 0
            }
        };
    }

    /**
     * Authenticates user with generic error response to prevent user enumeration.
     */
    static async login({ email, password }) {
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
            throw { statusCode: 400, message: "Valid email address and password are required" };
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: sanitizedEmail });

        // Generic error message for both non-existent user and wrong password
        if (!user || !user.password) {
            logger.warn("Failed login attempt (user not found)", { email: sanitizedEmail });
            throw { statusCode: 400, message: "Incorrect email address or password" };
        }

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            logger.warn("Failed login attempt (incorrect password)", { email: sanitizedEmail, userId: user._id });
            throw { statusCode: 400, message: "Incorrect email address or password" };
        }

        const token = createSecretToken(user._id);
        logger.info("User logged in successfully", { userId: user._id, email: sanitizedEmail });

        return {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                funds: user.funds || 0
            }
        };
    }

    /**
     * Retrieves user profile details.
     */
    static async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: "User not found" };
        }

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone || "",
            bio: user.bio || "",
            funds: user.funds || 0,
            createdAt: user.createdAt
        };
    }

    /**
     * Updates user profile fields.
     */
    static async updateProfile(userId, { username, email, phone, bio }) {
        const user = await User.findById(userId);
        if (!user) {
            throw { statusCode: 404, message: "User account not found" };
        }

        if (username && typeof username === "string" && username.trim().length >= 2) {
            user.username = username.trim();
        }
        if (email && isValidEmail(email)) {
            user.email = email.trim().toLowerCase();
        }
        if (phone !== undefined && typeof phone === "string") {
            user.phone = phone.trim();
        }
        if (bio !== undefined && typeof bio === "string") {
            user.bio = bio.trim();
        }

        await user.save();
        logger.info("User profile updated", { userId: user._id });

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            bio: user.bio
        };
    }
}

module.exports = AuthService;
