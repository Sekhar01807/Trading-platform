/**
 * Declarative Request Validation Middleware
 */

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && emailRegex.test(email.trim());
};

const SCHEMAS = {
    signup: (body) => {
        const { username, email, password } = body || {};
        if (!username || typeof username !== "string" || username.trim().length < 2 || username.trim().length > 30) {
            return "Username must be between 2 and 30 characters long";
        }
        if (!validateEmail(email)) {
            return "Please provide a valid email address";
        }
        if (!password || typeof password !== "string" || password.length < 8) {
            return "Password must be at least 8 characters long";
        }
        return null;
    },

    login: (body) => {
        const { email, password } = body || {};
        if (!email || !password || typeof email !== "string" || typeof password !== "string") {
            return "Valid email address and password are required";
        }
        return null;
    },

    placeOrder: (body) => {
        const { name, qty, price, mode } = body || {};
        const numQty = Number(qty);
        const numPrice = Number(price);

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return "Valid stock symbol is required";
        }
        if (isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
            return "Quantity must be a positive whole number";
        }
        if (isNaN(numPrice) || numPrice <= 0) {
            return "Price must be a positive number";
        }
        const upperMode = typeof mode === "string" ? mode.toUpperCase() : "";
        if (upperMode !== "BUY" && upperMode !== "SELL") {
            return "Order mode must be either BUY or SELL";
        }
        return null;
    },

    updateFunds: (body) => {
        const { amount, action } = body || {};
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return "Amount must be a positive number";
        }
        const upperAction = typeof action === "string" ? action.toUpperCase() : "";
        if (upperAction !== "ADD" && upperAction !== "WITHDRAW") {
            return "Action must be either ADD or WITHDRAW";
        }
        return null;
    },

    createRazorpayOrder: (body) => {
        const { amount } = body || {};
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return "Invalid deposit amount. Minimum is ₹1";
        }
        return null;
    },

    verifyRazorpayPayment: (body) => {
        const { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body || {};
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return "Invalid deposit amount";
        }
        if (!razorpay_payment_id || typeof razorpay_payment_id !== "string" ||
            !razorpay_order_id || typeof razorpay_order_id !== "string" ||
            !razorpay_signature || typeof razorpay_signature !== "string") {
            return "Missing payment verification fields (payment_id, order_id, signature).";
        }
        return null;
    }
};

const validateRequest = (schemaName) => {
    const validator = SCHEMAS[schemaName];
    if (!validator) {
        throw new Error(`Validation schema '${schemaName}' does not exist.`);
    }

    return (req, res, next) => {
        const error = validator(req.body, req.query, req.params);
        if (error) {
            return res.status(400).json({
                status: false,
                success: false,
                message: error
            });
        }
        next();
    };
};

module.exports = { validateRequest, SCHEMAS };
