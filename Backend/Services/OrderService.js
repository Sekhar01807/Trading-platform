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
        // Ensures simultaneous requests cannot double-spend user balance
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, funds: { $gte: totalOrderCost } },
            { $inc: { funds: -totalOrderCost } },
            { new: true }
        );

        if (!updatedUser) {
            const user = await User.findById(userId);
            const currentFunds = user ? (user.funds || 0) : 0;

            // Audit rejected order in OrderModel
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
                holding.price = price; // Latest execution/market price
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
            // Rollback funds if holding update failed unexpectedly
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
        // Prevents selling more shares than the user currently holds during concurrent requests
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

        // If holding quantity is 0 after deduction, clean up holding record
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
     * Retrieves order history for a user
     */
    static async getUserOrders(userId) {
        return await OrderModel.find({ userId }).sort({ createdAt: -1 });
    }
}

module.exports = OrderService;
