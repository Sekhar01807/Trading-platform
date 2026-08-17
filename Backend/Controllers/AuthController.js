const User = require("../model/UserModel");
const { createSecretToken } = require("../util/SecretToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Input Sanitization & Email Regex Helper
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && emailRegex.test(email.trim());
};

const Signup = async (req, res, next) => {
    try {
        const { email, password, username, createdAt } = req.body;

        // 1. Validation & Input Sanitization
        if (!username || typeof username !== "string" || username.trim().length < 2 || username.trim().length > 30) {
            return res.status(400).json({ message: "Username must be between 2 and 30 characters long", success: false });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please provide a valid email address", success: false });
        }

        if (!password || typeof password !== "string" || password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long", success: false });
        }

        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedUsername = username.trim();

        const existingUser = await User.findOne({ email: sanitizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email address already exists", success: false });
        }

        const user = await User.create({
            email: sanitizedEmail,
            password,
            username: sanitizedUsername,
            createdAt: createdAt || new Date()
        });

        const token = createSecretToken(user._id);
        const isProduction = process.env.NODE_ENV === "production";

        // Set secure HTTP-only cookie with zero JavaScript access
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        // Zero token exposure in JSON payload
        res.status(201).json({
            message: "User signed up successfully",
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal Server Error during registration", success: false });
    }
};

const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Valid email address and password are required", success: false });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: sanitizedEmail });
        if (!user) {
            return res.status(400).json({ message: "Incorrect email address or password", success: false });
        }

        if (!user.password) {
            return res.status(400).json({ message: "User account corrupted or invalid login method", success: false });
        }

        const auth = await bcrypt.compare(password, user.password);
        if (!auth) {
            return res.status(400).json({ message: "Incorrect email address or password", success: false });
        }

        const token = createSecretToken(user._id);
        const isProduction = process.env.NODE_ENV === "production";

        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        // Zero token exposure in JSON payload
        res.status(200).json({
            message: "User logged in successfully",
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                funds: user.funds || 0
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error during login", success: false });
    }
};

const Logout = (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/"
    });
    return res.status(200).json({
        message: "User logged out successfully",
        success: true
    });
};

const UpdateProfile = async (req, res) => {
    try {
        const userId = req.userId || (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }

        const { username, email, phone, bio } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User account not found", success: false });
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

        res.json({
            message: "Profile updated successfully",
            success: true,
            user: {
                username: user.username,
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                id: user._id
            }
        });
    } catch (error) {
        console.error("UpdateProfile error:", error);
        res.status(500).json({ message: "Error updating profile", success: false });
    }
};

module.exports = {
    Signup,
    Login,
    Logout,
    UpdateProfile
};
