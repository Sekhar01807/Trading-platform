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
        if (!/[a-zA-Z]/.test(password) || !/[\d\W]/.test(password)) {
            return "Password must contain both letters and numbers or special characters";
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
        const { name, symbol, qty, quantity, price, requestedPrice, mode, side, productType, orderType } = body || {};
        const stockSymbol = name || symbol;
        const numQty = Number(qty || quantity);
        const numPrice = Number(price || requestedPrice);

        if (!stockSymbol || typeof stockSymbol !== "string" || stockSymbol.trim().length === 0) {
            return "Valid stock symbol is required";
        }
        if (isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
            return "Quantity must be a positive whole number";
        }
        if (isNaN(numPrice) || numPrice <= 0) {
            return "Price must be a positive number";
        }
        const orderMode = (mode || side || "").toString().toUpperCase();
        if (orderMode !== "BUY" && orderMode !== "SELL") {
            return "Order mode must be either BUY or SELL";
        }
        if (productType && !["CNC", "MIS"].includes(productType.toString().toUpperCase())) {
            return "Product type must be either CNC or MIS";
        }
        if (orderType && !["MARKET", "LIMIT"].includes(orderType.toString().toUpperCase())) {
            return "Order type must be either MARKET or LIMIT";
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
