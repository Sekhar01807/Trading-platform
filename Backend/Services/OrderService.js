const mongoose = require("mongoose");
const { OrderModel } = require("../model/OrderModel");
const { HoldingModel } = require("../model/HoldingModel");
const User = require("../model/UserModel");
const { TransactionModel } = require("../model/TransactionModel");
const { ORDER_STATUS, ORDER_MODE, TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../config/constants");
const logger = require("../util/logger");

class OrderService {
    /**
     * Executes a BUY or SELL order with server-enforced business rules,
     * atomic race-condition protection, and ledger auditing.
     */
    static async executeOrder({
        userId,
        name,
        symbol,
        qty,
        quantity,
        price,
        requestedPrice,
        mode,
        side,
        productType = "CNC",
        orderType = "MARKET"
    }) {
        const stockSymbol = (name || symbol || "").trim().toUpperCase();
        const orderQty = Number(qty || quantity);
        const orderPrice = Number(price || requestedPrice);
        const orderMode = (mode || side || "").trim().toUpperCase();

        // 1. Central Server-side Input Validation
        if (!stockSymbol || stockSymbol.length === 0) {
            throw { statusCode: 400, message: "Valid stock symbol is required." };
        }

        if (isNaN(orderQty) || orderQty <= 0 || !Number.isInteger(orderQty)) {
            throw { statusCode: 400, message: "Order quantity must be a positive whole integer." };
        }

        if (isNaN(orderPrice) || orderPrice <= 0) {
            throw { statusCode: 400, message: "Order price must be greater than zero." };
        }

        if (orderMode !== ORDER_MODE.BUY && orderMode !== ORDER_MODE.SELL) {
            throw { statusCode: 400, message: "Invalid order mode. Must be BUY or SELL." };
        }

        // 2. Separate Market/Requested Price from Execution Price (simulated fill)
        const reqPrice = Number(requestedPrice) > 0 ? Number(requestedPrice) : orderPrice;
        const execPrice = orderPrice; // In simulated paper-trading, filled at current market execution price

        if (orderMode === ORDER_MODE.BUY) {
            return await this.executeBuyOrder({
                userId,
                name: stockSymbol,
                qty: orderQty,
                requestedPrice: reqPrice,
                executedPrice: execPrice,
                productType,
                orderType
            });
        } else {
            return await this.executeSellOrder({
                userId,
                name: stockSymbol,
                qty: orderQty,
                requestedPrice: reqPrice,
                executedPrice: execPrice,
                productType,
                orderType
            });
        }
    }

    /**
     * Concurrency-safe BUY order execution
     */
    static async executeBuyOrder({ userId, name, qty, requestedPrice, executedPrice, productType, orderType }) {
        const totalOrderCost = Number((qty * executedPrice).toFixed(2));

        // 1. Atomic Balance Validation & Deduction
        // Never trust frontend balance. Enforces funds >= totalOrderCost atomically.
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, funds: { $gte: totalOrderCost } },
            { $inc: { funds: -totalOrderCost } },
            { new: true }
        );

        if (!updatedUser) {
            const user = await User.findById(userId);
            const currentFunds = user ? (user.funds || 0) : 0;
            const failureReason = `Insufficient wallet balance. Required ₹${totalOrderCost.toFixed(2)}, Available ₹${currentFunds.toFixed(2)}.`;

            // Record rejected order in audit trail
            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                symbol: name,
                qty,
                quantity: qty,
                price: executedPrice,
                requestedPrice,
                executedPrice,
                marketPrice: requestedPrice,
                mode: ORDER_MODE.BUY,
                side: ORDER_MODE.BUY,
                productType,
                orderType,
                status: ORDER_STATUS.REJECTED,
                failureReason,
                totalCost: totalOrderCost
            });

            logger.warn("BUY Order Rejected: Insufficient Funds", {
                userId,
                symbol: name,
                qty,
                required: totalOrderCost,
                available: currentFunds
            });

            throw {
                statusCode: 400,
                message: `Order Rejected: Insufficient wallet balance! Required ₹${totalOrderCost.toFixed(2)}, Available ₹${currentFunds.toFixed(2)}. Please add funds in the Funds tab to trade.`,
                order: rejectedOrder
            };
        }

        const balanceBefore = updatedUser.funds + totalOrderCost;
        const balanceAfter = updatedUser.funds;

        try {
            // 2. Cost Basis (Weighted Average Price) Calculation & Holding Update
            let holding = await HoldingModel.findOne({ userId, name });

            if (holding) {
                const totalQty = holding.qty + qty;
                const totalCostBasis = (holding.qty * holding.avg) + (qty * executedPrice);
                holding.qty = totalQty;
                holding.avg = Number((totalCostBasis / totalQty).toFixed(2));
                holding.price = executedPrice;
                holding.updatedAt = new Date();
                await holding.save();
            } else {
                holding = await HoldingModel.create({
                    userId,
                    name,
                    qty,
                    avg: executedPrice,
                    price: executedPrice,
                    net: "+0.00%",
                    day: "+0.00%",
                    isLoss: false
                });
            }

            // 3. Save executed order record
            const executedOrder = await OrderModel.create({
                userId,
                name,
                symbol: name,
                qty,
                quantity: qty,
                price: executedPrice,
                requestedPrice,
                executedPrice,
                marketPrice: requestedPrice,
                mode: ORDER_MODE.BUY,
                side: ORDER_MODE.BUY,
                productType,
                orderType,
                status: ORDER_STATUS.EXECUTED,
                totalCost: totalOrderCost
            });

            // 4. Record wallet ledger entry
            await TransactionModel.create({
                userId,
                type: TRANSACTION_TYPE.ORDER_BUY,
                amount: totalOrderCost,
                balanceBefore,
                balanceAfter,
                status: TRANSACTION_STATUS.SUCCESS,
                referenceId: executedOrder._id.toString(),
                description: `Bought ${qty} share(s) of ${name} @ ₹${executedPrice.toFixed(2)}`
            });

            logger.info("BUY Order Executed", {
                userId,
                orderId: executedOrder._id,
                symbol: name,
                qty,
                fillPrice: executedPrice,
                totalCost: totalOrderCost,
                remainingFunds: balanceAfter
            });

            return {
                success: true,
                message: `BUY order executed successfully! Bought ${qty} ${name} @ ₹${executedPrice.toFixed(2)}`,
                order: executedOrder,
                remainingFunds: balanceAfter
            };
        } catch (error) {
            // Rollback deducted funds if holding or order write fails
            await User.findByIdAndUpdate(userId, { $inc: { funds: totalOrderCost } });
            logger.error("BUY Order Execution Failure, funds rolled back", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Concurrency-safe SELL order execution
     */
    static async executeSellOrder({ userId, name, qty, requestedPrice, executedPrice, productType, orderType }) {
        const totalSaleProceeds = Number((qty * executedPrice).toFixed(2));

        // 1. Atomic Holding Quantity Validation & Deduction
        // Never trust frontend holdings. Enforces qty >= requested sell qty atomically.
        const holding = await HoldingModel.findOneAndUpdate(
            { userId, name, qty: { $gte: qty } },
            { $inc: { qty: -qty } },
            { new: true }
        );

        if (!holding) {
            const currentHolding = await HoldingModel.findOne({ userId, name });
            const ownedQty = currentHolding ? currentHolding.qty : 0;
            const failureReason = `User only owns ${ownedQty} share(s) of ${name}. Cannot sell ${qty} share(s).`;

            // Record rejected order in audit trail
            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                symbol: name,
                qty,
                quantity: qty,
                price: executedPrice,
                requestedPrice,
                executedPrice,
                marketPrice: requestedPrice,
                mode: ORDER_MODE.SELL,
                side: ORDER_MODE.SELL,
                productType,
                orderType,
                status: ORDER_STATUS.REJECTED,
                failureReason,
                totalCost: totalSaleProceeds
            });

            logger.warn("SELL Order Rejected: Insufficient Shares", {
                userId,
                symbol: name,
                requestedQty: qty,
                ownedQty
            });

            throw {
                statusCode: 400,
                message: `Sell order rejected: You only own ${ownedQty} share(s) of ${name}. Cannot sell ${qty} share(s)!`,
                order: rejectedOrder
            };
        }

        // If all shares of this stock were sold, remove holding entry
        if (holding.qty === 0) {
            await HoldingModel.deleteOne({ _id: holding._id });
        }

        try {
            // 2. Atomically Credit Sale Proceeds to User Balance
            const userBefore = await User.findById(userId);
            const balanceBefore = userBefore ? (userBefore.funds || 0) : 0;

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { funds: totalSaleProceeds } },
                { new: true }
            );
            const balanceAfter = updatedUser ? updatedUser.funds : balanceBefore + totalSaleProceeds;

            // 3. Save executed order record
            const executedOrder = await OrderModel.create({
                userId,
                name,
                symbol: name,
                qty,
                quantity: qty,
                price: executedPrice,
                requestedPrice,
                executedPrice,
                marketPrice: requestedPrice,
                mode: ORDER_MODE.SELL,
                side: ORDER_MODE.SELL,
                productType,
                orderType,
                status: ORDER_STATUS.EXECUTED,
                totalCost: totalSaleProceeds
            });

            // 4. Record wallet ledger entry
            await TransactionModel.create({
                userId,
                type: TRANSACTION_TYPE.ORDER_SELL,
                amount: totalSaleProceeds,
                balanceBefore,
                balanceAfter,
                status: TRANSACTION_STATUS.SUCCESS,
                referenceId: executedOrder._id.toString(),
                description: `Sold ${qty} share(s) of ${name} @ ₹${executedPrice.toFixed(2)}`
            });

            logger.info("SELL Order Executed", {
                userId,
                orderId: executedOrder._id,
                symbol: name,
                qty,
                fillPrice: executedPrice,
                proceeds: totalSaleProceeds,
                totalFunds: balanceAfter
            });

            return {
                success: true,
                message: `SELL order executed successfully! Sold ${qty} ${name} @ ₹${executedPrice.toFixed(2)}`,
                order: executedOrder,
                totalFunds: balanceAfter
            };
        } catch (error) {
            // Rollback holding deduction if user credit or order save fails
            await HoldingModel.findOneAndUpdate(
                { userId, name },
                { $inc: { qty } },
                { upsert: true }
            );
            logger.error("SELL Order Execution Failure, holdings restored", { userId, error: error.message });
            throw error;
        }
    }

    /**
     * Retrieves user orders with pagination, filtering & sorting.
     * Enforces user isolation: always scoped strictly to the authenticated userId.
     */
    static async getUserOrders(userId, queryParams = {}) {
        const {
            page = 1,
            limit = 50,
            status,
            mode,
            symbol,
            sortBy = "createdAt",
            sortOrder = "desc",
            dateFrom,
            dateTo
        } = queryParams;

        const filter = { userId };

        // 1. Status Filter
        if (status && status !== "ALL") {
            filter.status = status.toUpperCase();
        }

        // 2. Mode Filter (BUY / SELL)
        if (mode && mode !== "ALL") {
            filter.mode = mode.toUpperCase();
        }

        // 3. Symbol Search (Sanitized)
        if (symbol && typeof symbol === "string" && symbol.trim().length > 0) {
            const escaped = symbol.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.name = { $regex: escaped, $options: "i" };
        }

        // 4. Date Range Filter
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        // 5. Sorting
        const validSortFields = ["createdAt", "price", "qty", "totalCost", "name"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortDirection = sortOrder === "asc" ? 1 : -1;
        const sortOption = { [sortField]: sortDirection };

        // 6. Pagination
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (parsedPage - 1) * parsedLimit;

        const [orders, totalOrders] = await Promise.all([
            OrderModel.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(parsedLimit),
            OrderModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalOrders / parsedLimit) || 1;

        return {
            status: true,
            data: orders,
            pagination: {
                totalOrders,
                page: parsedPage,
                limit: parsedLimit,
                totalPages,
                hasNextPage: parsedPage < totalPages,
                hasPrevPage: parsedPage > 1
            },
            filtersApplied: {
                status: status || "ALL",
                mode: mode || "ALL",
                symbol: symbol || null,
                sortBy: sortField,
                sortOrder: sortDirection === 1 ? "asc" : "desc"
            }
        };
    }
}

module.exports = OrderService;
