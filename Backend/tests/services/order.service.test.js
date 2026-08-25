const OrderService = require("../../Services/OrderService");
const User = require("../../model/UserModel");
const { HoldingModel } = require("../../model/HoldingModel");
const { OrderModel } = require("../../model/OrderModel");
const { TransactionModel } = require("../../model/TransactionModel");
const { ORDER_STATUS, ORDER_TYPE, TRANSACTION_TYPE, INITIAL_PRICES } = require("../../config/constants");
const { initTestDB, cleanupTestUsers, teardownTestDB } = require("../helpers/testHelper");

jest.setTimeout(30000);

describe("Domain Service: OrderService Business Logic & Transactions", () => {
    let testUser = null;
    const testEmail = `order_svc_test_${Date.now()}@pulsetrade.com`;

    beforeAll(async () => {
        await initTestDB();
        await User.deleteMany({ email: /order_svc_test_.*@pulsetrade\.com/i });

        testUser = await User.create({
            username: "OrderSvcTrader",
            email: testEmail,
            password: "HashedPassword123!",
            funds: 50000
        });
    });

    afterAll(async () => {
        if (testUser) {
            await cleanupTestUsers([testUser._id]);
        }
        await teardownTestDB();
    });

    // 1. INPUT VALIDATION & GUARDRAILS
    describe("Input Validation & Guardrails", () => {
        test("should reject missing or empty stock symbol", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "",
                qty: 1,
                price: 100,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Valid stock symbol is required")
            });
        });

        test("should reject unsupported/non-tradable instrument symbol", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "UNSUPPORTED_STOCK_XYZ",
                qty: 1,
                price: 100,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("not a supported tradable stock")
            });
        });

        test("should reject non-positive or non-integer order quantities", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: -5,
                price: 1500,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("positive whole integer")
            });

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 0,
                price: 1500,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("positive whole integer")
            });

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 2.75,
                price: 1500,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("positive whole integer")
            });
        });

        test("should reject invalid order price (<= 0 or NaN)", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 1,
                price: 0,
                mode: "BUY"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("price must be greater than zero")
            });
        });

        test("should reject invalid order mode", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 1,
                price: 1500,
                mode: "HOLD"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Must be BUY or SELL")
            });
        });

        test("should reject unsupported product types (non-CNC)", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 1,
                price: 1500,
                mode: "BUY",
                productType: "MIS"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Only CNC (Equity Delivery) product type is supported")
            });
        });
    });

    // 2. BUY EXECUTION & LIMIT LOGIC
    describe("BUY Execution & Limit Semantics", () => {
        test("BUY with insufficient balance should fail and record REJECTED order in audit trail", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 1000,
                price: 1500,
                mode: "BUY",
                orderType: "MARKET"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Insufficient wallet balance")
            });

            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            const rejected = await OrderModel.findOne({
                userId: testUser._id,
                name: "INFY",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejected).not.toBeNull();
            expect(rejected.failureReason).toContain("Insufficient wallet balance");
        });

        test("LIMIT BUY rejected when limit price < market price", async () => {
            const MarketTickerService = require("../../Services/MarketTickerService");
            const marketPrice = MarketTickerService.getLivePrices()["WIPRO"] || INITIAL_PRICES["WIPRO"] || 465.25;
            const unfillableLimitPrice = Number((marketPrice - 50).toFixed(2));

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "WIPRO",
                qty: 2,
                price: unfillableLimitPrice,
                mode: "BUY",
                orderType: "LIMIT"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("below current market price")
            });

            const rejectedOrder = await OrderModel.findOne({
                userId: testUser._id,
                name: "WIPRO",
                orderType: ORDER_TYPE.LIMIT,
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
        });

        test("LIMIT BUY executes when limit price >= market price", async () => {
            const MarketTickerService = require("../../Services/MarketTickerService");
            const marketPrice = MarketTickerService.getLivePrices()["WIPRO"] || INITIAL_PRICES["WIPRO"] || 465.25;
            const fillableLimitPrice = Number((marketPrice + 50).toFixed(2));

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "WIPRO",
                qty: 2,
                price: fillableLimitPrice,
                mode: "BUY",
                orderType: "LIMIT"
            });

            expect(result.success).toBe(true);
            expect(result.order.status).toBe(ORDER_STATUS.EXECUTED);

            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "WIPRO" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(2);
        });

        test("MARKET BUY executes atomically, updates cost basis and writes ledger", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: 10,
                price: 124.15,
                mode: "BUY",
                orderType: "MARKET"
            });

            expect(result.success).toBe(true);
            expect(result.order.status).toBe(ORDER_STATUS.EXECUTED);
            expect(result.remainingFunds).toBeLessThan(balanceBefore);

            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(10);

            const tx = await TransactionModel.findOne({
                userId: testUser._id,
                referenceId: result.order._id.toString(),
                type: TRANSACTION_TYPE.ORDER_BUY
            });
            expect(tx).not.toBeNull();
            expect(tx.status).toBe("SUCCESS");
        });

        test("Second BUY of same stock calculates weighted average cost basis accurately", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            const initialQty = holdingBefore.qty;
            const initialAvg = holdingBefore.avg;

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: 10,
                price: 130,
                mode: "BUY"
            });

            const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holdingAfter.qty).toBe(initialQty + 10);

            const expectedTotalCost = (initialQty * initialAvg) + (10 * result.order.executedPrice);
            const expectedAvg = Number((expectedTotalCost / holdingAfter.qty).toFixed(2));
            expect(holdingAfter.avg).toBe(expectedAvg);
        });
    });

    // 3. SELL EXECUTION & HOLDINGS UPDATES
    describe("SELL Execution & Holdings State", () => {
        test("SELL stock that user DOES NOT OWN should fail and record REJECTED order", async () => {
            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "RELIANCE",
                qty: 1,
                price: 2100,
                mode: "SELL"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("only own 0 share(s)")
            });

            const rejectedOrder = await OrderModel.findOne({
                userId: testUser._id,
                name: "RELIANCE",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
        });

        test("SELL MORE shares than owned should fail and record REJECTED order", async () => {
            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            const owned = holding.qty;

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: owned + 50,
                price: 125,
                mode: "SELL"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining(`only own ${owned} share(s)`)
            });
        });

        test("LIMIT SELL rejected when limit price > current market price", async () => {
            const MarketTickerService = require("../../Services/MarketTickerService");
            const marketPrice = MarketTickerService.getLivePrices()["TATAPOWER"] || INITIAL_PRICES["TATAPOWER"] || 124.15;
            const unfillableLimitPrice = Number((marketPrice + 500).toFixed(2));

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: 2,
                price: unfillableLimitPrice,
                mode: "SELL",
                orderType: "LIMIT"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("above current market price")
            });
        });

        test("Partial SELL decrements holding quantity, credits proceeds, and writes ledger", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            const qtyToSell = 5;
            const userBefore = await User.findById(testUser._id);

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: qtyToSell,
                price: 125,
                mode: "SELL"
            });

            expect(result.success).toBe(true);
            expect(result.totalFunds).toBeGreaterThan(userBefore.funds);

            const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holdingAfter).not.toBeNull();
            expect(holdingAfter.qty).toBe(holdingBefore.qty - qtyToSell);
            expect(holdingAfter.avg).toBe(holdingBefore.avg);
        });

        test("Complete SELL deletes holding document when qty reaches 0", async () => {
            const holdingBefore = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            const remainingQty = holdingBefore.qty;

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: remainingQty,
                price: 125,
                mode: "SELL"
            });

            expect(result.success).toBe(true);

            const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holdingAfter).toBeNull();
        });
    });
});
