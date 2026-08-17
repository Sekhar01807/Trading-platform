const OrderService = require("../Services/OrderService");

const getAllOrders = async (req, res, next) => {
    try {
        const userId = req.userId;
        const orders = await OrderService.getUserOrders(userId);
        res.status(200).json(orders);
    } catch (error) {
        next(error);
    }
};

const placeOrder = async (req, res, next) => {
    try {
        const userId = req.userId;
        const { name, qty, price, mode, productType, orderType } = req.body;

        const result = await OrderService.executeOrder({
            userId,
            name,
            qty,
            price,
            mode,
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
