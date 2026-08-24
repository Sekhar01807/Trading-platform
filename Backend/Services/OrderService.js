const mongoose = require("mongoose");
const { OrderModel } = require("../model/OrderModel");
const { HoldingModel } = require("../model/HoldingModel");
const User = require("../model/UserModel");
const { TransactionModel } = require("../model/TransactionModel");
const { ORDER_STATUS, ORDER_MODE, PRODUCT_TYPE, ORDER_TYPE, TRANSACTION_TYPE, TRANSACTION_STATUS, INITIAL_PRICES, TRADABLE_SYMBOLS } = require("../config/constants");
const MarketTickerService = require("./MarketTickerService");
const { runInTransaction } = require("../util/transactionHelper");
const logger = require("../util/logger");

class OrderService {
    /**
     * Executes a BUY or SELL order with server-authoritative market pricing,
     * honest LIMIT/MARKET order evaluation, and true ACID MongoDB multi-document transactions.
     */
    static async executeOrder({
        userId,
        name,
        qty,
        price,
        mode,
        productType = PRODUCT_TYPE.CNC,
        orderType = ORDER_TYPE.MARKET
    }) {
        const stockSymbol = (name || "").trim().toUpperCase();
        const orderQty = Number(qty);
        const clientRequestedPrice = Number(price);
        const orderMode = (mode || "").trim().toUpperCase();
        const cleanProductType = (productType || PRODUCT_TYPE.CNC).toString().trim().toUpperCase();
        const cleanOrderType = Object.values(ORDER_TYPE).includes(orderType?.toUpperCase())
            ? orderType.toUpperCase()
            : ORDER_TYPE.MARKET;

        // 1. Central Server-side Input Validation
        if (!stockSymbol || stockSymbol.length === 0) {
            throw { statusCode: 400, message: "Valid stock symbol is required." };
        }

        if (!TRADABLE_SYMBOLS.includes(stockSymbol)) {
            throw {
                statusCode: 400,
                message: `Instrument '${stockSymbol}' is not a supported tradable stock on PulseTrade.`
            };
        }

        if (isNaN(orderQty) || orderQty <= 0 || !Number.isInteger(orderQty)) {
            throw { statusCode: 400, message: "Order quantity must be a positive whole integer." };
        }

        if (isNaN(clientRequestedPrice) || clientRequestedPrice <= 0) {
            throw { statusCode: 400, message: "Order price must be greater than zero." };
        }

        if (orderMode !== ORDER_MODE.BUY && orderMode !== ORDER_MODE.SELL) {
            throw { statusCode: 400, message: "Invalid order mode. Must be BUY or SELL." };
        }

        if (cleanProductType !== PRODUCT_TYPE.CNC) {
            throw {
                statusCode: 400,
                message: "Only CNC (Equity Delivery) product type is supported for portfolio trading."
            };
        }

        // 2. Server-Authoritative Market Pricing (Strictly server-determined, NO client fallback)
        const livePrices = MarketTickerService.getLivePrices();
        const liveMarketPrice = livePrices[stockSymbol] || INITIAL_PRICES[stockSymbol];

        if (!liveMarketPrice || isNaN(liveMarketPrice) || liveMarketPrice <= 0) {
            throw {
                statusCode: 400,
                message: `Live market pricing is currently unavailable for '${stockSymbol}'. Order rejected.`
            };
        }

        const serverMarketPrice = Number(liveMarketPrice.toFixed(2));
        const normalizedRequestedPrice = Number(clientRequestedPrice.toFixed(2));

        let executedPrice = serverMarketPrice;

        // 3. Honest LIMIT vs MARKET Order Evaluation
        if (cleanOrderType === ORDER_TYPE.LIMIT) {
            if (orderMode === ORDER_MODE.BUY) {
                // BUY Limit: buyer wants to pay at most normalizedRequestedPrice
                if (normalizedRequestedPrice < serverMarketPrice) {
                    const failureReason = `Limit BUY price ₹${normalizedRequestedPrice.toFixed(2)} is below current market price ₹${serverMarketPrice.toFixed(2)}. Limit order cannot be executed.`;
                    const rejectedOrder = await OrderModel.create({
                        userId,
                        name: stockSymbol,
                        qty: orderQty,
                        price: normalizedRequestedPrice,
                        requestedPrice: normalizedRequestedPrice,
                        executedPrice: 0,
                        marketPrice: serverMarketPrice,
                        mode: ORDER_MODE.BUY,
                        productType: cleanProductType,
                        orderType: cleanOrderType,
                        status: ORDER_STATUS.REJECTED,
                        failureReason,
                        totalCost: Number((orderQty * normalizedRequestedPrice).toFixed(2))
                    });

                    logger.warn("LIMIT BUY Order Rejected: Price condition not met", {
                        userId,
                        symbol: stockSymbol,
                        limitPrice: normalizedRequestedPrice,
                        marketPrice: serverMarketPrice
                    });

                    throw {
                        statusCode: 400,
                        message: `Order Rejected: ${failureReason}`,
                        order: rejectedOrder
                    };
                }
                // Marketable Limit Buy: executes at current market price
                executedPrice = serverMarketPrice;
            } else {
                // SELL Limit: seller wants to receive at least normalizedRequestedPrice
                if (normalizedRequestedPrice > serverMarketPrice) {
                    const failureReason = `Limit SELL price ₹${normalizedRequestedPrice.toFixed(2)} is above current market price ₹${serverMarketPrice.toFixed(2)}. Limit order cannot be executed.`;
                    const rejectedOrder = await OrderModel.create({
                        userId,
                        name: stockSymbol,
                        qty: orderQty,
                        price: normalizedRequestedPrice,
                        requestedPrice: normalizedRequestedPrice,
                        executedPrice: 0,
                        marketPrice: serverMarketPrice,
                        mode: ORDER_MODE.SELL,
                        productType: cleanProductType,
                        orderType: cleanOrderType,
                        status: ORDER_STATUS.REJECTED,
                        failureReason,
                        totalCost: Number((orderQty * normalizedRequestedPrice).toFixed(2))
                    });

                    logger.warn("LIMIT SELL Order Rejected: Price condition not met", {
                        userId,
                        symbol: stockSymbol,
                        limitPrice: normalizedRequestedPrice,
                        marketPrice: serverMarketPrice
                    });

                    throw {
                        statusCode: 400,
                        message: `Order Rejected: ${failureReason}`,
                        order: rejectedOrder
                    };
                }
                executedPrice = serverMarketPrice;
            }
        } else {
            // MARKET Order: Authoritative server market execution
            executedPrice = serverMarketPrice;
        }

        if (orderMode === ORDER_MODE.BUY) {
            return await this.executeBuyOrder({
                userId,
                name: stockSymbol,
                qty: orderQty,
                requestedPrice: normalizedRequestedPrice,
                executedPrice,
                marketPrice: serverMarketPrice,
                productType: cleanProductType,
                orderType: cleanOrderType
            });
        } else {
            return await this.executeSellOrder({
                userId,
                name: stockSymbol,
                qty: orderQty,
                requestedPrice: normalizedRequestedPrice,
                executedPrice,
                marketPrice: serverMarketPrice,
                productType: cleanProductType,
                orderType: cleanOrderType
            });
        }
    }

    /**
     * Executes BUY order inside a single MongoDB session transaction covering:
     * - User funds deduction
     * - Holding creation / weighted cost basis update
     * - Order creation (status: EXECUTED)
     * - Financial ledger entry (TransactionModel)
     */
    static async executeBuyOrder({ userId, name, qty, requestedPrice, executedPrice, marketPrice, productType, orderType }) {
        const totalOrderCost = Number((qty * executedPrice).toFixed(2));

        // 1. Pre-check User Balance to reject early and record audit if insufficient
        const userCheck = await User.findById(userId);
        const currentFunds = userCheck ? Number((userCheck.funds || 0).toFixed(2)) : 0;

        if (!userCheck || currentFunds < totalOrderCost) {
            const failureReason = `Insufficient wallet balance. Required ₹${totalOrderCost.toFixed(2)}, Available ₹${currentFunds.toFixed(2)}.`;

            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                qty,
                price: executedPrice,
                requestedPrice,
                executedPrice: 0,
                marketPrice,
                mode: ORDER_MODE.BUY,
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

        // 2. Execute within strict MongoDB multi-document session transaction
        return await runInTransaction(async (session) => {
            // A. Deduct User Balance Conditionally within session
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId, funds: { $gte: totalOrderCost } },
                { $inc: { funds: -totalOrderCost } },
                { returnDocument: "after", session }
            );

            if (!updatedUser) {
                throw {
                    statusCode: 400,
                    message: "Order Rejected: Insufficient wallet balance at execution time."
                };
            }

            const balanceAfter = Number(updatedUser.funds.toFixed(2));
            const balanceBefore = Number((balanceAfter + totalOrderCost).toFixed(2));

            // B. Cost Basis (Weighted Average Price) Calculation & Holding Update within session
            let holding = await HoldingModel.findOne({ userId, name }, null, { session });

            if (holding) {
                const totalQty = holding.qty + qty;
                const totalCostBasis = (holding.qty * holding.avg) + (qty * executedPrice);
                const avg = Number((totalCostBasis / totalQty).toFixed(2));
                await HoldingModel.findByIdAndUpdate(
                    holding._id,
                    {
                        qty: totalQty,
                        avg,
                        price: executedPrice,
                        updatedAt: new Date()
                    },
                    { session }
                );
            } else {
                const newHoldings = await HoldingModel.create(
                    [{
                        userId,
                        name,
                        qty,
                        avg: executedPrice,
                        price: executedPrice,
                        net: "+0.00%",
                        day: "+0.00%",
                        isLoss: false
                    }],
                    { session }
                );
                holding = Array.isArray(newHoldings) ? newHoldings[0] : newHoldings;
            }

            // C. Create executed order record within session
            const newOrders = await OrderModel.create(
                [{
                    userId,
                    name,
                    qty,
                    price: executedPrice,
                    requestedPrice,
                    executedPrice,
                    marketPrice,
                    mode: ORDER_MODE.BUY,
                    productType,
                    orderType,
                    status: ORDER_STATUS.EXECUTED,
                    totalCost: totalOrderCost
                }],
                { session }
            );
            const executedOrder = Array.isArray(newOrders) ? newOrders[0] : newOrders;

            // D. Record wallet ledger entry within session
            await TransactionModel.create(
                [{
                    userId,
                    type: TRANSACTION_TYPE.ORDER_BUY,
                    amount: totalOrderCost,
                    balanceBefore,
                    balanceAfter,
                    status: TRANSACTION_STATUS.SUCCESS,
                    referenceId: executedOrder._id.toString(),
                    description: `Bought ${qty} share(s) of ${name} @ ₹${executedPrice.toFixed(2)}`
                }],
                { session }
            );

            logger.info("BUY Order Executed via Transaction", {
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
        });
    }

    /**
     * Executes SELL order inside a single MongoDB session transaction covering:
     * - Holding quantity deduction (or removal if 0)
     * - User funds crediting
     * - Order creation (status: EXECUTED)
     * - Financial ledger entry (TransactionModel)
     */
    static async executeSellOrder({ userId, name, qty, requestedPrice, executedPrice, marketPrice, productType, orderType }) {
        const totalSaleProceeds = Number((qty * executedPrice).toFixed(2));

        // 1. Pre-check Holding Ownership to reject early and record audit
        const currentHolding = await HoldingModel.findOne({ userId, name });
        const ownedQty = currentHolding ? currentHolding.qty : 0;

        if (!currentHolding || ownedQty < qty) {
            const failureReason = `User only owns ${ownedQty} share(s) of ${name}. Cannot sell ${qty} share(s).`;

            const rejectedOrder = await OrderModel.create({
                userId,
                name,
                qty,
                price: executedPrice,
                requestedPrice,
                executedPrice: 0,
                marketPrice,
                mode: ORDER_MODE.SELL,
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

        // 2. Execute within strict MongoDB multi-document session transaction
        return await runInTransaction(async (session) => {
            // A. Deduct Holding Quantity Conditionally within session
            const updatedHolding = await HoldingModel.findOneAndUpdate(
                { userId, name, qty: { $gte: qty } },
                { $inc: { qty: -qty } },
                { returnDocument: "after", session }
            );

            if (!updatedHolding) {
                throw {
                    statusCode: 400,
                    message: `Sell order rejected: Insufficient share balance at execution time.`
                };
            }

            // If all shares sold, remove holding entry within session
            if (updatedHolding.qty === 0) {
                await HoldingModel.deleteOne({ _id: updatedHolding._id }, { session });
            }

            // B. Credit Sale Proceeds to User Balance within session
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { funds: totalSaleProceeds } },
                { returnDocument: "after", session }
            );

            if (!updatedUser) {
                throw { statusCode: 404, message: "User not found" };
            }

            const balanceAfter = Number(updatedUser.funds.toFixed(2));
            const balanceBefore = Number((balanceAfter - totalSaleProceeds).toFixed(2));

            // C. Create executed order record within session
            const newOrders = await OrderModel.create(
                [{
                    userId,
                    name,
                    qty,
                    price: executedPrice,
                    requestedPrice,
                    executedPrice,
                    marketPrice,
                    mode: ORDER_MODE.SELL,
                    productType,
                    orderType,
                    status: ORDER_STATUS.EXECUTED,
                    totalCost: totalSaleProceeds
                }],
                { session }
            );
            const executedOrder = Array.isArray(newOrders) ? newOrders[0] : newOrders;

            // D. Record wallet ledger entry within session
            await TransactionModel.create(
                [{
                    userId,
                    type: TRANSACTION_TYPE.ORDER_SELL,
                    amount: totalSaleProceeds,
                    balanceBefore,
                    balanceAfter,
                    status: TRANSACTION_STATUS.SUCCESS,
                    referenceId: executedOrder._id.toString(),
                    description: `Sold ${qty} share(s) of ${name} @ ₹${executedPrice.toFixed(2)}`
                }],
                { session }
            );

            logger.info("SELL Order Executed via Transaction", {
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
        });
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

        // 3. Symbol Search (Sanitized regex)
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
