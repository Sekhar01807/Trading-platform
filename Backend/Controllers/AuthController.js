const AuthService = require("../Services/AuthService");

const Signup = async (req, res, next) => {
    try {
        const { email, password, username, createdAt } = req.body;
        const result = await AuthService.signup({ username, email, password, createdAt });

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        // Zero token exposure in JSON payload
        res.status(201).json({
            message: "User signed up successfully",
            success: true,
            user: result.user
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
    }
};

const Login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login({ email, password });

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        // Zero token exposure in JSON payload
        res.status(200).json({
            message: "User logged in successfully",
            success: true,
            user: result.user
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
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

const LogoutAll = async (req, res, next) => {
    try {
        const userId = req.userId || (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }

        await AuthService.signOutAllDevices(userId);

        const isProduction = process.env.NODE_ENV === "production";
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/"
        });

        return res.status(200).json({
            message: "Successfully signed out from all devices",
            success: true
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
    }
};

const UpdateProfile = async (req, res, next) => {
    try {
        const userId = req.userId || (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }

        const { username, email, phone, bio } = req.body;
        const updatedUser = await AuthService.updateProfile(userId, { username, email, phone, bio });

        res.status(200).json({
            message: "Profile updated successfully",
            success: true,
            user: updatedUser
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
    }
};

const ChangePassword = async (req, res, next) => {
    try {
        const userId = req.userId || (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }

        const { currentPassword, newPassword } = req.body;
        const result = await AuthService.changePassword(userId, { currentPassword, newPassword });

        const isProduction = process.env.NODE_ENV === "production";
        res.cookie("token", result.token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        res.status(200).json({
            message: result.message,
            success: true
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
    }
};

const DeleteAccount = async (req, res, next) => {
    try {
        const userId = req.userId || (req.user ? req.user._id : null);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized access", success: false });
        }

        const { password } = req.body;
        const result = await AuthService.deleteAccount(userId, { password });

        const isProduction = process.env.NODE_ENV === "production";
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            path: "/"
        });

        res.status(200).json({
            message: result.message,
            success: true
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
                success: false
            });
        }
        next(error);
    }
};

module.exports = {
    Signup,
    Login,
    Logout,
    LogoutAll,
    UpdateProfile,
    ChangePassword,
    DeleteAccount
};

