const crypto = require("crypto");
const mongoose = require("mongoose");

const { connectDB, closeDB } = require("../config/db");
const User = require("../model/UserModel");
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { OrderModel } = require("../model/OrderModel");
const { TransactionModel } = require("../model/TransactionModel");
const { PaymentRecordModel } = require("../model/PaymentRecordModel");
const OrderService = require("../Services/OrderService");
const WalletService = require("../Services/WalletService");
const { ORDER_STATUS, ORDER_MODE, ORDER_TYPE, TRANSACTION_TYPE, INITIAL_PRICES } = require("../config/constants");

process.env.NODE_ENV = "test";
process.env.TOKEN_KEY = process.env.TOKEN_KEY || "PulseTrade_CI_Test_JWT_Secret_Key_2026!@#";
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "pulsetrade_mock_test_secret_for_hmac_signatures";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

jest.setTimeout(30000);

describe("PulseTrade Service-Level Business Logic & Transaction Test Suite", () => {
    let testUser = null;
    let testUser2 = null;

    const email1 = `service_trader_1_${Date.now()}@pulsetrade.com`;
    const email2 = `service_trader_2_${Date.now()}@pulsetrade.com`;

    beforeAll(async () => {
        process.env.RAZORPAY_KEY_SECRET = RAZORPAY_SECRET;
        await connectDB();
        await User.deleteMany({ email: /service_trader_.*@pulsetrade\.com/i });

        testUser = await User.create({
            username: "ServiceTrader1",
            email: email1,
            password: "HashedPassword123!",
            funds: 50000
        });

        testUser2 = await User.create({
            username: "ServiceTrader2",
            email: email2,
            password: "HashedPassword123!",
            funds: 10000
        });
    }, 30000);

    afterAll(async () => {
        if (testUser || testUser2) {
            const userIds = [testUser?._id, testUser2?._id].filter(Boolean);
            await User.deleteMany({ _id: { $in: userIds } });
            await HoldingModel.deleteMany({ userId: { $in: userIds } });
            await PositionModel.deleteMany({ userId: { $in: userIds } });
            await OrderModel.deleteMany({ userId: { $in: userIds } });
            await TransactionModel.deleteMany({ userId: { $in: userIds } });
            await PaymentRecordModel.deleteMany({ userId: { $in: userIds } });
        }
        await closeDB();
    }, 30000);

    // =========================================================================
    // 1. ORDER SERVICE: INPUT VALIDATION & GUARDRAILS
    // =========================================================================
    describe("1. OrderService Input Validation & Guardrails", () => {
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
            // Negative quantity
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

            // Zero quantity
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

            // Floating-point quantity
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

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "INFY",
                qty: 1,
                price: -100,
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

    // =========================================================================
    // 2. ORDER SERVICE: BUY EXECUTION & LIMIT LOGIC
    // =========================================================================
    describe("2. OrderService BUY Execution & Limit Semantics", () => {
        test("BUY with insufficient balance should fail and record REJECTED order in audit trail", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            // INFY ~1555. Buy 1000 shares = ~1,555,000 (User only has 50000)
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

            // Funds must remain completely untouched
            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            // Audit record must be created as REJECTED
            const rejected = await OrderModel.findOne({
                userId: testUser._id,
                name: "INFY",
                status: ORDER_STATUS.REJECTED
            });
            expect(rejected).not.toBeNull();
            expect(rejected.failureReason).toContain("Insufficient wallet balance");

            // Holding must NOT have been created
            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "INFY" });
            expect(holding).toBeNull();
        });

        test("LIMIT BUY rejected when limit price < market price", async () => {
            const marketPrice = INITIAL_PRICES["WIPRO"] || 465.25;
            const unfillableLimitPrice = Number((marketPrice - 50).toFixed(2));

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "WIPRO",
                qty: 2,
                price: unfillableLimitPrice,
                requestedPrice: unfillableLimitPrice,
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
            const marketPrice = INITIAL_PRICES["WIPRO"] || 465.25;
            const fillableLimitPrice = Number((marketPrice + 50).toFixed(2));

            const result = await OrderService.executeOrder({
                userId: testUser._id,
                name: "WIPRO",
                qty: 2,
                price: fillableLimitPrice,
                requestedPrice: fillableLimitPrice,
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

            // Holding verified
            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holding).not.toBeNull();
            expect(holding.qty).toBe(10);
            expect(holding.avg).toBe(result.order.executedPrice);

            // Ledger verified
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

    // =========================================================================
    // 3. ORDER SERVICE: SELL EXECUTION & HOLDINGS UPDATES
    // =========================================================================
    describe("3. OrderService SELL Execution & Holdings State", () => {
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

            // Holding qty should not have changed
            const holdingAfter = await HoldingModel.findOne({ userId: testUser._id, name: "TATAPOWER" });
            expect(holdingAfter.qty).toBe(owned);
        });

        test("LIMIT SELL rejected when limit price > current market price", async () => {
            const marketPrice = INITIAL_PRICES["TATAPOWER"] || 124.15;
            const unfillableLimitPrice = Number((marketPrice + 500).toFixed(2));

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "TATAPOWER",
                qty: 2,
                price: unfillableLimitPrice,
                requestedPrice: unfillableLimitPrice,
                mode: "SELL",
                orderType: "LIMIT"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("above current market price")
            });

            const rejectedOrder = await OrderModel.findOne({
                userId: testUser._id,
                name: "TATAPOWER",
                orderType: ORDER_TYPE.LIMIT,
                status: ORDER_STATUS.REJECTED
            });
            expect(rejectedOrder).not.toBeNull();
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
            expect(holdingAfter.avg).toBe(holdingBefore.avg); // Cost basis preserved on partial sell
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

    // =========================================================================
    // 4. TRANSACTION FAILURE SEMANTICS & ROLLBACK PROOF
    // =========================================================================
    describe("4. Transaction Failure Semantics & Rollback Verification", () => {
        test("BUY: Failure on Holding create/update must rollback funds and order", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            // Spy and fail HoldingModel.create inside transaction
            const spy = jest.spyOn(HoldingModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated database failure during HoldingModel.create");
            });

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "SBIN",
                qty: 5,
                price: 500,
                mode: "BUY"
            })).rejects.toThrow("Simulated database failure during HoldingModel.create");

            // Funds must be completely restored
            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            // Holding must NOT exist
            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "SBIN" });
            expect(holding).toBeNull();

            // Executed order must NOT exist
            const executedOrder = await OrderModel.findOne({
                userId: testUser._id,
                name: "SBIN",
                status: ORDER_STATUS.EXECUTED
            });
            expect(executedOrder).toBeNull();

            // Transaction ledger must NOT exist
            const tx = await TransactionModel.findOne({
                userId: testUser._id,
                description: /SBIN/
            });
            expect(tx).toBeNull();

            spy.mockRestore();
        });

        test("BUY: Failure on TransactionModel.create must rollback funds and holding", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated database failure during TransactionModel.create");
            });

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "SBIN",
                qty: 5,
                price: 500,
                mode: "BUY"
            })).rejects.toThrow("Simulated database failure during TransactionModel.create");

            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "SBIN" });
            expect(holding).toBeNull();

            const order = await OrderModel.findOne({
                userId: testUser._id,
                name: "SBIN",
                status: ORDER_STATUS.EXECUTED
            });
            expect(order).toBeNull();

            spy.mockRestore();
        });

        test("SELL: Failure on TransactionModel.create must rollback holding reduction and funds credit", async () => {
            // Seed a holding for testing
            await HoldingModel.create({
                userId: testUser._id,
                name: "HDFCBANK",
                qty: 10,
                avg: 1500,
                price: 1500
            });

            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated failure during SELL TransactionModel.create");
            });

            await expect(OrderService.executeOrder({
                userId: testUser._id,
                name: "HDFCBANK",
                qty: 5,
                price: 1500,
                mode: "SELL"
            })).rejects.toThrow("Simulated failure during SELL TransactionModel.create");

            // Holding qty must NOT be reduced (remains 10)
            const holding = await HoldingModel.findOne({ userId: testUser._id, name: "HDFCBANK" });
            expect(holding.qty).toBe(10);

            // Funds must NOT be credited
            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            // Order must NOT be recorded as EXECUTED
            const executedOrder = await OrderModel.findOne({
                userId: testUser._id,
                name: "HDFCBANK",
                status: ORDER_STATUS.EXECUTED
            });
            expect(executedOrder).toBeNull();

            spy.mockRestore();
        });
    });

    // =========================================================================
    // 5. WALLET SERVICE: DEPOSIT, WITHDRAWAL & GET SUMMARY
    // =========================================================================
    describe("5. WalletService Funds & Ledger Management", () => {
        test("getFundsSummary should calculate portfolio values accurately", async () => {
            const summary = await WalletService.getFundsSummary(testUser._id);
            expect(summary.status).toBe(true);
            expect(summary.availableCash).toBeGreaterThan(0);
            expect(summary.spentOnHoldings).toBeGreaterThanOrEqual(0);
            expect(summary.totalNetWorth).toBe(Number((summary.availableCash + summary.currentPortfolioValue).toFixed(2)));
        });

        test("updateFunds with invalid amount or action should reject with 400", async () => {
            await expect(WalletService.updateFunds(testUser._id, -500, "ADD"))
                .rejects.toMatchObject({ statusCode: 400 });

            await expect(WalletService.updateFunds(testUser._id, 0, "ADD"))
                .rejects.toMatchObject({ statusCode: 400 });

            await expect(WalletService.updateFunds(testUser._id, 500, "UNKNOWN_ACTION"))
                .rejects.toMatchObject({ statusCode: 400 });
        });

        test("updateFunds ADD should increment funds and write DEPOSIT ledger atomically", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const res = await WalletService.updateFunds(testUser._id, 25000, "ADD");
            expect(res.status).toBe(true);
            expect(res.totalAddedFunds).toBe(balanceBefore + 25000);

            const tx = await TransactionModel.findOne({
                userId: testUser._id,
                type: TRANSACTION_TYPE.DEPOSIT,
                amount: 25000
            });
            expect(tx).not.toBeNull();
            expect(tx.balanceAfter).toBe(balanceBefore + 25000);
        });

        test("updateFunds WITHDRAW exceeding balance should reject with 400", async () => {
            const user = await User.findById(testUser._id);
            const currentFunds = user.funds;

            await expect(WalletService.updateFunds(testUser._id, currentFunds + 100000, "WITHDRAW"))
                .rejects.toMatchObject({
                    statusCode: 400,
                    message: expect.stringContaining("exceeds available cash balance")
                });
        });

        test("updateFunds WITHDRAW valid amount should decrement funds and write WITHDRAWAL ledger", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const res = await WalletService.updateFunds(testUser._id, 5000, "WITHDRAW");
            expect(res.status).toBe(true);
            expect(res.totalAddedFunds).toBe(balanceBefore - 5000);

            const tx = await TransactionModel.findOne({
                userId: testUser._id,
                type: TRANSACTION_TYPE.WITHDRAWAL,
                amount: 5000
            });
            expect(tx).not.toBeNull();
            expect(tx.balanceAfter).toBe(balanceBefore - 5000);
        });

        test("updateFunds rollback: Failure on ledger create must restore balance", async () => {
            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            const spy = jest.spyOn(TransactionModel, "create").mockImplementationOnce(() => {
                throw new Error("Simulated failure during manual deposit ledger write");
            });

            await expect(WalletService.updateFunds(testUser._id, 10000, "ADD"))
                .rejects.toThrow("Simulated failure during manual deposit ledger write");

            const userAfter = await User.findById(testUser._id);
            expect(userAfter.funds).toBe(balanceBefore);

            spy.mockRestore();
        });
    });

    // =========================================================================
    // 6. WALLET SERVICE: RAZORPAY VERIFICATION & CONSTANT-TIME HMAC
    // =========================================================================
    describe("6. WalletService Payment Verification & Constant-Time HMAC", () => {
        let testOrderId = "";

        test("createRazorpayOrder should store PENDING payment record server-side", async () => {
            const result = await WalletService.createRazorpayOrder(testUser._id, 15000);
            expect(result.status).toBe(true);
            expect(result.order_id).toBeDefined();
            testOrderId = result.order_id;

            const pending = await PaymentRecordModel.findOne({ razorpay_order_id: testOrderId });
            expect(pending).not.toBeNull();
            expect(pending.amount).toBe(15000);
            expect(pending.status).toBe("PENDING");
            expect(pending.userId.toString()).toBe(testUser._id.toString());
        });

        test("verifyRazorpayPayment should reject missing verification parameters", async () => {
            await expect(WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 15000,
                razorpay_payment_id: "pay_123"
                // Missing order_id and signature
            })).rejects.toMatchObject({ statusCode: 400 });
        });

        test("verifyRazorpayPayment should reject forged/tampered HMAC signature (constant-time check)", async () => {
            await expect(WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 15000,
                razorpay_payment_id: `pay_tamper_${Date.now()}`,
                razorpay_order_id: testOrderId,
                razorpay_signature: "invalid_forged_hmac_hex_signature"
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Payment signature verification failed")
            });
        });

        test("verifyRazorpayPayment should reject when no server pending order exists", async () => {
            const fakeOrderId = `order_unrecorded_${Date.now()}`;
            const fakePaymentId = `pay_unrecorded_${Date.now()}`;
            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${fakeOrderId}|${fakePaymentId}`)
                .digest("hex");

            await expect(WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 15000,
                razorpay_payment_id: fakePaymentId,
                razorpay_order_id: fakeOrderId,
                razorpay_signature: signature
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("No pending order found")
            });
        });

        test("verifyRazorpayPayment should reject amount mismatch with server order", async () => {
            const paymentId = `pay_mismatch_${Date.now()}`;
            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${testOrderId}|${paymentId}`)
                .digest("hex");

            await expect(WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 99999, // Expected 15000
                razorpay_payment_id: paymentId,
                razorpay_order_id: testOrderId,
                razorpay_signature: signature
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Payment amount mismatch")
            });
        });

        test("verifyRazorpayPayment should reject cross-user order verification attempt", async () => {
            const paymentId = `pay_cross_${Date.now()}`;
            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${testOrderId}|${paymentId}`)
                .digest("hex");

            // User 2 trying to verify User 1's pending order
            await expect(WalletService.verifyRazorpayPayment(testUser2._id, {
                amount: 15000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: testOrderId,
                razorpay_signature: signature
            })).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("No pending order found")
            });
        });

        test("verifyRazorpayPayment with valid constant-time HMAC should credit wallet and support idempotent replay", async () => {
            const paymentId = `pay_valid_${Date.now()}`;
            const signature = crypto
                .createHmac("sha256", RAZORPAY_SECRET)
                .update(`${testOrderId}|${paymentId}`)
                .digest("hex");

            const userBefore = await User.findById(testUser._id);
            const balanceBefore = userBefore.funds;

            // 1. Initial credit
            const res1 = await WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 15000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: testOrderId,
                razorpay_signature: signature
            });

            expect(res1.status).toBe(true);
            expect(res1.totalAddedFunds).toBe(balanceBefore + 15000);

            // Verify status changed to SUCCESS
            const updatedPending = await PaymentRecordModel.findOne({ razorpay_order_id: testOrderId });
            expect(updatedPending.status).toBe("SUCCESS");

            // Verify transaction ledger written
            const tx = await TransactionModel.findOne({ referenceId: paymentId });
            expect(tx).not.toBeNull();
            expect(tx.amount).toBe(15000);

            // 2. Idempotent replay
            const res2 = await WalletService.verifyRazorpayPayment(testUser._id, {
                amount: 15000,
                razorpay_payment_id: paymentId,
                razorpay_order_id: testOrderId,
                razorpay_signature: signature
            });

            expect(res2.status).toBe(true);
            expect(res2.idempotentReplay).toBe(true);

            // Funds must not increase a second time
            const userAfterReplay = await User.findById(testUser._id);
            expect(userAfterReplay.funds).toBe(balanceBefore + 15000);
        });
    });
});
