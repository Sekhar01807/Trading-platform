const OrderService = require("../Services/OrderService");

const getAllOrders = async (req, res, next) => {
    try {
        const userId = req.userId;
        const result = await OrderService.getUserOrders(userId, req.query);

        // If client specifically passes pagination query params (page/limit/status/mode/symbol), return full metadata object
        if (req.query && (req.query.page || req.query.limit || req.query.status || req.query.mode || req.query.symbol)) {
            return res.status(200).json(result);
        }

        // Default legacy fallback: return direct array for simple legacy calls, while attaching pagination in headers
        res.setHeader("X-Total-Count", result.pagination.totalOrders);
        res.setHeader("X-Total-Pages", result.pagination.totalPages);
        res.status(200).json(result.data);
    } catch (error) {
        next(error);
    }
};

const placeOrder = async (req, res, next) => {
    try {
        const userId = req.userId;
        const {
            name,
            symbol,
            qty,
            quantity,
            price,
            requestedPrice,
            mode,
            side,
            productType,
            orderType
        } = req.body || {};

        // Canonical normalization: resolve standard/legacy fields into canonical order request
        const cleanSymbol = (symbol || name || "").toString().trim().toUpperCase();
        const cleanQty = quantity !== undefined && quantity !== null && quantity !== "" ? quantity : qty;
        const cleanPrice = requestedPrice !== undefined && requestedPrice !== null && requestedPrice !== "" ? requestedPrice : price;
        const cleanSide = (side || mode || "").toString().trim().toUpperCase();

        const result = await OrderService.executeOrder({
            userId,
            symbol: cleanSymbol,
            name: cleanSymbol,
            quantity: cleanQty,
            qty: cleanQty,
            price: cleanPrice,
            requestedPrice: cleanPrice,
            side: cleanSide,
            mode: cleanSide,
            productType,
            orderType
        });

        res.status(201).json(result);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: false,
                message: error.message,
                order: error.order
            });
        }
        next(error);
    }
};

module.exports = {
    getAllOrders,
    placeOrder
};
