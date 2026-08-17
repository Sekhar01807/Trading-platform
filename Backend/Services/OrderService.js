const { OrderModel } = require("../model/OrderModel");
const { HoldingModel } = require("../model/HoldingModel");
const User = require("../model/UserModel");
const { TransactionModel } = require("../model/TransactionModel");
const { ORDER_STATUS, ORDER_MODE, TRANSACTION_TYPE } = require("../config/constants");

class OrderService {
    /**
     * Executes a BUY or SELL order with atomic concurrency protection and ledger auditing.
     */
    static async executeOrder({ userId, name, qty, price, mode, productType = "CNC", orderType = "MARKET" }) {
        const numQty = Number(qty);
        const numPrice = Number(price);

        if (!name || isNaN(numQty) || numQty <= 0 || isNaN(numPrice) || numPrice <= 0 || !mode) {
            throw {
                statusCode: 400,
                message: "Valid name, quantity, price, and order mode are required."
            };
        }

        const upperMode = mode.toUpperCase();
        if (upperMode !== ORDER_MODE.BUY && upperMode !== ORDER_MODE.SELL) {
            throw {
                statusCode: 400,
                message: "Invalid order mode. Must be BUY or SELL."
            };
        }

        const cleanSymbol = name.trim().toUpperCase();

        if (upperMode === ORDER_MODE.BUY) {
            return await this.executeBuyOrder({
                userId,
                name: cleanSymbol,
                qty: numQty,
                price: numPrice,
                productType,
                orderType
            });
        } else {
            return await this.executeSellOrder({
                userId,
                name: cleanSymbol,
                qty: numQty,
                price: numPrice,
                productType,
                orderType
            });
        }
    }

    /**
     * Atomic, concurrency-safe BUY order execution
     */
    static async executeBuyOrder({ userId, name, qty, price, productType, orderType }) {
        const totalOrderCost = Number((qty * price).toFixed(2));

        // 1. Atomic Balance Check & Deduction:
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, funds: { $gte: totalOrderCost } },
            { $inc: { funds: -totalOrderCost } },
            { new: true }
        );

        if (!updatedUser) {
            const user = await User.findById(userId);
            const currentFunds = user ? (user.funds || 0) : 0;

            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                qty,
                price,
                marketPrice: price,
                mode: ORDER_MODE.BUY,
                productType,
                orderType,
                status: ORDER_STATUS.REJECTED,
                failureReason: `Insufficient wallet balance. Required ₹${totalOrderCost.toFixed(2)}, Available ₹${currentFunds.toFixed(2)}.`,
                totalCost: totalOrderCost
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
                const totalCostBasis = (holding.qty * holding.avg) + (qty * price);
                holding.qty = totalQty;
                holding.avg = Number((totalCostBasis / totalQty).toFixed(2));
                holding.price = price;
                holding.updatedAt = new Date();
                await holding.save();
            } else {
                holding = await HoldingModel.create({
                    userId,
                    name,
                    qty,
                    avg: price,
                    price: price,
                    net: "+0.00%",
                    day: "+0.00%",
                    isLoss: false
                });
            }

            // 3. Save executed order record
            const executedOrder = await OrderModel.create({
                userId,
                name,
                qty,
                price,
                marketPrice: price,
                mode: ORDER_MODE.BUY,
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
                referenceId: executedOrder._id.toString(),
                description: `Bought ${qty} share(s) of ${name} @ ₹${price.toFixed(2)}`
            });

            return {
                success: true,
                message: `BUY order executed successfully! Bought ${qty} ${name} @ ₹${price.toFixed(2)}`,
                order: executedOrder,
                remainingFunds: balanceAfter
            };
        } catch (error) {
            await User.findByIdAndUpdate(userId, { $inc: { funds: totalOrderCost } });
            throw error;
        }
    }

    /**
     * Atomic, concurrency-safe SELL order execution
     */
    static async executeSellOrder({ userId, name, qty, price, productType, orderType }) {
        const totalSaleProceeds = Number((qty * price).toFixed(2));

        // 1. Atomic Holding Quantity Deduction:
        const holding = await HoldingModel.findOneAndUpdate(
            { userId, name, qty: { $gte: qty } },
            { $inc: { qty: -qty } },
            { new: true }
        );

        if (!holding) {
            const currentHolding = await HoldingModel.findOne({ userId, name });
            const ownedQty = currentHolding ? currentHolding.qty : 0;

            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                qty,
                price,
                marketPrice: price,
                mode: ORDER_MODE.SELL,
                productType,
                orderType,
                status: ORDER_STATUS.REJECTED,
                failureReason: `User only owns ${ownedQty} share(s) of ${name}. Cannot sell ${qty} share(s).`,
                totalCost: totalSaleProceeds
            });

            throw {
                statusCode: 400,
                message: `Sell order rejected: You only own ${ownedQty} share(s) of ${name}. Cannot sell ${qty} share(s)!`,
                order: rejectedOrder
            };
        }

        if (holding.qty === 0) {
            await HoldingModel.deleteOne({ _id: holding._id });
        }

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
            qty,
            price,
            marketPrice: price,
            mode: ORDER_MODE.SELL,
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
            referenceId: executedOrder._id.toString(),
            description: `Sold ${qty} share(s) of ${name} @ ₹${price.toFixed(2)}`
        });

        return {
            success: true,
            message: `SELL order executed successfully! Sold ${qty} ${name} @ ₹${price.toFixed(2)}`,
            order: executedOrder,
            totalFunds: balanceAfter
        };
    }

    /**
     * Retrieves user orders with pagination, filtering & sorting
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

        // 3. Symbol Search (Regex)
        if (symbol && symbol.trim().length > 0) {
            filter.name = { $regex: symbol.trim(), $options: "i" };
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
