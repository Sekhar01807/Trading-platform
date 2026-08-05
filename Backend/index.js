require("dotenv").config();
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const jwt = require("jsonwebtoken");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const { HoldingModel } = require("./model/HoldingModel");
const { PositionModel } = require("./model/PositionModel");
const { OrderModel } = require("./model/OrderModel");
const User = require("./model/UserModel");
const authRoute = require("./Routes/AuthRoute");

const PORT = process.env.PORT || 3000;
const ATLASDB_URL = process.env.ATLASDB_URL;

// Security Headers Middleware (Wanderlust Production Security)
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

// Sliding Window Rate Limiter for Auth Routes (Brute-force protection)
const rateLimitMap = new Map();
const authRateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minute window
    const maxRequests = 20; // Max 20 auth attempts per 15 mins per IP

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
    }

    const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    if (timestamps.length > maxRequests) {
        return res.status(429).json({
            status: false,
            message: "Too many login/signup attempts. Please try again after 15 minutes."
        });
    }
    next();
};

app.use("/login", authRateLimiter);
app.use("/signup", authRateLimiter);

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

app.use(cookieParser());
app.use(bodyParser.json());
app.use("/", authRoute);

module.exports.createSecretToken = (id) => {
    return jwt.sign({ id }, process.env.TOKEN_KEY, {
        expiresIn: 3 * 24 * 60 * 60,
    });
};

const getUserIdFromReq = (req) => {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    if (!token) return null;
    try {
        const data = jwt.verify(token, process.env.TOKEN_KEY);
        return data.id;
    } catch (err) {
        return null;
    }
};


app.get("/allHoldings", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        let holdings = await HoldingModel.find({ userId });
        res.json(holdings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching holdings" });
    }
});

app.get("/allPositions", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        let positions = await PositionModel.find({ userId });
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching positions" });
    }
});

app.post("/seedDemoData", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        await HoldingModel.deleteMany({ userId });
        await PositionModel.deleteMany({ userId });

        const defaultHoldings = [
            { userId, name: "BHARTIARTL", qty: 2, avg: 538.05, price: 541.15, net: "+0.58%", day: "+2.99%", isLoss: false },
            { userId, name: "HDFCBANK", qty: 2, avg: 1383.4, price: 1522.35, net: "+10.04%", day: "+0.11%", isLoss: false },
            { userId, name: "HINDUNILVR", qty: 1, avg: 2335.85, price: 2417.4, net: "+3.49%", day: "+0.21%", isLoss: false },
            { userId, name: "INFY", qty: 1, avg: 1350.5, price: 1555.45, net: "+15.18%", day: "-1.60%", isLoss: true },
            { userId, name: "ITC", qty: 5, avg: 202.0, price: 207.9, net: "+2.92%", day: "+0.80%", isLoss: false },
            { userId, name: "KPITTECH", qty: 5, avg: 250.3, price: 266.45, net: "+6.45%", day: "+3.54%", isLoss: false },
            { userId, name: "M&M", qty: 2, avg: 809.9, price: 779.8, net: "-3.72%", day: "-0.01%", isLoss: true },
            { userId, name: "RELIANCE", qty: 1, avg: 2193.7, price: 2112.4, net: "-3.71%", day: "+1.44%", isLoss: false },
            { userId, name: "SBIN", qty: 4, avg: 324.35, price: 430.2, net: "+32.63%", day: "-0.34%", isLoss: true },
            { userId, name: "TATAPOWER", qty: 5, avg: 104.2, price: 124.15, net: "+19.15%", day: "-0.24%", isLoss: true },
            { userId, name: "TCS", qty: 1, avg: 3041.7, price: 3194.8, net: "+5.03%", day: "-0.25%", isLoss: true },
            { userId, name: "WIPRO", qty: 4, avg: 489.3, price: 577.75, net: "+18.08%", day: "+0.32%", isLoss: false }
        ];

        const defaultPositions = [
            { userId, product: "CNC", name: "EVEREADY", qty: 2, avg: 316.27, price: 312.35, net: "+0.58%", day: "-1.24%", isLoss: true },
            { userId, product: "CNC", name: "JUBLFOOD", qty: 1, avg: 3124.75, price: 3082.65, net: "+10.04%", day: "-1.35%", isLoss: true }
        ];

        const seededHoldings = await HoldingModel.insertMany(defaultHoldings);
        const seededPositions = await PositionModel.insertMany(defaultPositions);
        await User.findByIdAndUpdate(userId, { funds: 50000 });

        res.json({ success: true, message: "Demo portfolio loaded successfully with ₹50,000 test balance!", holdings: seededHoldings, positions: seededPositions });
    } catch (error) {
        res.status(500).json({ message: "Error seeding demo portfolio" });
    }
});

app.delete("/resetPortfolio", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        await HoldingModel.deleteMany({ userId });
        await PositionModel.deleteMany({ userId });
        await OrderModel.deleteMany({ userId });
        await User.findByIdAndUpdate(userId, { funds: 0 });
        res.json({ success: true, message: "Portfolio and funds reset to clean new user state (₹0.00 balance)." });
    } catch (error) {
        res.status(500).json({ message: "Error resetting portfolio" });
    }
});


app.get("/user/funds", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        const userObj = await User.findById(userId);
        const holdings = await HoldingModel.find({ userId });
        const spentOnHoldings = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
        const totalAddedFunds = userObj ? (userObj.funds || 0) : 0;
        const availableCash = Math.max(0, totalAddedFunds - spentOnHoldings);

        res.json({
            status: true,
            totalAddedFunds,
            spentOnHoldings,
            availableCash
        });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error fetching user funds" });
    }
});

app.post("/user/funds", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        const { amount, action } = req.body; // action: "ADD" or "WITHDRAW"
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return res.status(400).json({ status: false, message: "Invalid amount" });
        }

        const userObj = await User.findById(userId);
        if (!userObj) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        let currentFunds = userObj.funds || 0;
        if (action === "ADD") {
            currentFunds += numAmt;
        } else if (action === "WITHDRAW") {
            const holdings = await HoldingModel.find({ userId });
            const spentOnHoldings = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
            const availableCash = Math.max(0, currentFunds - spentOnHoldings);
            if (numAmt > availableCash) {
                return res.status(400).json({ status: false, message: "Withdrawal amount exceeds available cash!" });
            }
            currentFunds -= numAmt;
        } else {
            return res.status(400).json({ status: false, message: "Invalid action" });
        }

        userObj.funds = currentFunds;
        await userObj.save();

        res.json({ status: true, totalAddedFunds: currentFunds, message: `Successfully updated funds` });
    } catch (error) {
        res.status(500).json({ status: false, message: "Error updating funds" });
    }
});

app.post("/create-razorpay-order", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        const { amount } = req.body;
        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return res.status(400).json({ status: false, message: "Invalid deposit amount" });
        }

        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(500).json({ status: false, message: "Razorpay credentials not configured." });
        }

        const amountInPaise = Math.round(numAmt * 100);
        if (amountInPaise < 100) {
            return res.status(400).json({ status: false, message: "Minimum deposit is ₹1" });
        }

        const Razorpay = require("razorpay");
        const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: "rcpt_" + Date.now(),
        });

        res.json({
            status: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: razorpayKeyId
        });
    } catch (error) {
        console.error("Razorpay create order error:", error);
        res.status(500).json({ status: false, message: "Error creating Razorpay order" });
    }
});

// Verify Razorpay payment signature (HMAC-SHA256) and credit funds
app.post("/verify-razorpay-payment", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }

        const { amount, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ status: false, message: "Missing payment verification fields." });
        }

        const numAmt = parseFloat(amount);
        if (isNaN(numAmt) || numAmt <= 0) {
            return res.status(400).json({ status: false, message: "Invalid deposit amount" });
        }

        // HMAC-SHA256 signature verification
        const crypto = require("crypto");
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ status: false, message: "Payment signature verification failed. Possible fraud." });
        }

        // Signature matched — credit funds to user wallet
        const userObj = await User.findById(userId);
        if (!userObj) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        userObj.funds = (userObj.funds || 0) + numAmt;
        await userObj.save();

        console.log(`[Razorpay] ✓ Payment verified: ${razorpay_payment_id} | ₹${numAmt} credited to user ${userId}`);
        res.json({
            status: true,
            totalAddedFunds: userObj.funds,
            message: `✓ Payment Verified! ₹${numAmt.toLocaleString("en-IN")} credited to your trading wallet.`
        });
    } catch (error) {
        console.error("Razorpay verify payment error:", error);
        res.status(500).json({ status: false, message: "Error verifying payment" });
    }
});

app.get("/allOrders", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

app.post("/newOrders", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) {
            return res.status(401).json({ status: false, message: "Unauthorized access: Please log in." });
        }
        const { name, qty, price, mode } = req.body;
        const numQty = Number(qty);
        const numPrice = Number(price);

        if (!name || !numQty || numQty <= 0 || !numPrice || numPrice <= 0 || !mode) {
            return res.status(400).json({ status: false, message: "Valid name, quantity, price, and order mode are required." });
        }

        const userObj = await User.findById(userId);

        if (mode === "BUY") {
            // Check available cash margin
            const holdings = await HoldingModel.find({ userId });
            const spentOnHoldings = holdings.reduce((sum, h) => sum + (h.qty * h.avg), 0);
            const userFunds = userObj ? (userObj.funds || 0) : 0;
            const availableCash = Math.max(0, userFunds - spentOnHoldings);
            const totalOrderCost = numQty * numPrice;

            if (totalOrderCost > availableCash) {
                return res.status(400).json({
                    status: false,
                    message: `Order Rejected: Insufficient wallet balance! Required ₹${totalOrderCost.toFixed(2)}, Available ₹${availableCash.toFixed(2)}. Please add funds via Stripe in the Funds tab to trade.`
                });
            }

            let holding = await HoldingModel.findOne({ userId, name });
            if (holding) {
                const totalQty = holding.qty + numQty;
                const totalCost = (holding.qty * holding.avg) + (numQty * numPrice);
                holding.qty = totalQty;
                holding.avg = Number((totalCost / totalQty).toFixed(2));
                holding.price = numPrice;
                await holding.save();
            } else {
                await HoldingModel.create({
                    userId,
                    name,
                    qty: numQty,
                    avg: numPrice,
                    price: numPrice,
                    net: "+0.00%",
                    day: "+0.00%",
                    isLoss: false
                });
            }
        } else if (mode === "SELL") {
            // Strict check: User MUST own holdings of 'name' with qty >= numQty to SELL!
            let holding = await HoldingModel.findOne({ userId, name });

            if (!holding || holding.qty < numQty) {
                const ownedQty = holding ? holding.qty : 0;
                return res.status(400).json({
                    status: false,
                    message: `Sell order rejected: You only own ${ownedQty} share(s) of ${name}. Cannot sell ${numQty} share(s)!`
                });
            }

            if (holding.qty > numQty) {
                holding.qty -= numQty;
                await holding.save();
            } else {
                await HoldingModel.deleteOne({ _id: holding._id });
            }
        } else {
            return res.status(400).json({ status: false, message: "Invalid order mode." });
        }

        // Save order to OrderModel audit log ONLY after successful validation
        let newOrder = new OrderModel({
            userId,
            name,
            qty: numQty,
            price: numPrice,
            mode,
        });
        await newOrder.save();

        res.status(201).json({ message: `${mode} order executed successfully!`, success: true, order: newOrder });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ status: false, message: "Failed to process order" });
    }
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        success: false
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    mongoose.connect(ATLASDB_URL, { dbName: "zerodha" })
        .then(async () => {
            console.log("Connected to MongoDB database: zerodha");
        })
        .catch((error) => {
            console.error("MongoDB connection error:", error);
        });
});

const io = require("socket.io")(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

const symbolMap = {
    "BHARTIARTL": "BHARTIARTL.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
    "INFY": "INFY.NS",
    "ITC": "ITC.NS",
    "KPITTECH": "KPITTECH.NS",
    "M&M": "M&M.NS",
    "RELIANCE": "RELIANCE.NS",
    "SBIN": "SBIN.NS",
    "TATAPOWER": "TATAPOWER.NS",
    "TCS": "TCS.NS",
    "WIPRO": "WIPRO.NS",
    "EVEREADY": "EVEREADY.NS",
    "JUBLFOOD": "JUBLFOOD.NS",
    "ONGC": "ONGC.NS",
    "QUICKHEAL": "QUICKHEAL.NS",
    "HUL": "HINDUNILVR.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "AXISBANK": "AXISBANK.NS",
    "LT": "LT.NS",
    "ASIANPAINT": "ASIANPAINT.NS",
    "TITAN": "TITAN.NS",
    "MARUTI": "MARUTI.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "HCLTECH": "HCLTECH.NS",
    "ADANIENT": "ADANIENT.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "ULTRACEMCO": "ULTRACEMCO.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "TATASTEEL": "TATASTEEL.NS",
    "NTPC": "NTPC.NS",
    "POWERGRID": "POWERGRID.NS",
    "COALINDIA": "COALINDIA.NS",
    "NESTLEIND": "NESTLEIND.NS",
    "TECHM": "TECHM.NS",
    "INDUSINDBK": "INDUSINDBK.NS",
    "HEROMOTOCO": "HEROMOTOCO.NS",
    "CIPLA": "CIPLA.NS",
    "EICHERMOT": "EICHERMOT.NS",
    "DRREDDY": "DRREDDY.NS",
    "GRASIM": "GRASIM.NS",
    "HDFCLIFE": "HDFCLIFE.NS",
    "BPCL": "BPCL.NS",
    "LTIM": "LTIM.NS",
    "BRITANNIA": "BRITANNIA.NS",
    "APOLLOHOSP": "APOLLOHOSP.NS",
    "PIDILITIND": "PIDILITIND.NS",
    "DLF": "DLF.NS",
    "ZOMATO": "ZOMATO.NS",
    "PAYTM": "PAYTM.NS",
    "JIOFIN": "JIOFIN.NS",
    "ADANIPORTS": "ADANIPORTS.NS",
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN"
};

let livePrices = {
    "BHARTIARTL": 1180.50,
    "HDFCBANK": 1522.35,
    "HINDUNILVR": 2417.4,
    "INFY": 1555.45,
    "ITC": 435.2,
    "KPITTECH": 266.45,
    "M&M": 779.8,
    "RELIANCE": 2112.4,
    "SBIN": 785.4,
    "SGBMAY29": 4719.0,
    "TATAPOWER": 420.15,
    "TCS": 3194.8,
    "WIPRO": 577.75,
    "EVEREADY": 312.35,
    "JUBLFOOD": 3082.65,
    "ONGC": 116.8,
    "QUICKHEAL": 308.55,
    "HUL": 512.4,
    "ICICIBANK": 1120.3,
    "AXISBANK": 1085.5,
    "LT": 3540.2,
    "ASIANPAINT": 2890.1,
    "TITAN": 3450.75,
    "MARUTI": 12450.0,
    "KOTAKBANK": 1780.2,
    "HCLTECH": 1620.5,
    "ADANIENT": 3150.0,
    "TATAMOTORS": 980.4,
    "SUNPHARMA": 1540.6,
    "ULTRACEMCO": 9850.0,
    "BAJFINANCE": 6950.0,
    "TATASTEEL": 165.4,
    "NTPC": 360.2,
    "POWERGRID": 290.5,
    "COALINDIA": 480.3,
    "NESTLEIND": 2510.0,
    "TECHM": 1320.4,
    "INDUSINDBK": 1420.0,
    "HEROMOTOCO": 4520.0,
    "CIPLA": 1480.0,
    "EICHERMOT": 4650.0,
    "DRREDDY": 6120.0,
    "GRASIM": 2240.0,
    "HDFCLIFE": 630.5,
    "BPCL": 610.2,
    "LTIM": 4950.0,
    "BRITANNIA": 5180.0,
    "APOLLOHOSP": 6250.0,
    "PIDILITIND": 2980.0,
    "DLF": 840.0,
    "ZOMATO": 195.5,
    "PAYTM": 410.2,
    "JIOFIN": 355.8,
    "ADANIPORTS": 1340.0,
    "NIFTY 50": 24512.40,
    "SENSEX": 80245.80
};

let subscribedSymbols = new Set(Object.values(symbolMap));

async function fetchLivePrices() {
    try {
        Object.values(symbolMap).forEach(sym => subscribedSymbols.add(sym));
        const symbols = Array.from(subscribedSymbols);
        if (symbols.length === 0) return;

        console.log(`[Socket] Fetching live stock market prices for ${symbols.length} symbols...`);

        let newPrices = {};
        try {
            const results = await yahooFinance.quote(symbols);
            results.forEach(quote => {
                const originalKey = Object.keys(symbolMap).find(key => symbolMap[key] === quote.symbol);
                if (originalKey && quote.regularMarketPrice) {
                    // Add realistic live tick movement
                    const tick = (Math.random() - 0.48) * (quote.regularMarketPrice * 0.003);
                    newPrices[originalKey] = parseFloat((quote.regularMarketPrice + tick).toFixed(2));
                }
            });
        } catch (e) {
            console.log("[Socket] Yahoo API quote note -> generating live simulated market ticks...");
        }

        // Apply live tick changes to all stocks in livePrices
        Object.keys(livePrices).forEach(key => {
            const currentVal = newPrices[key] || livePrices[key];
            const change = (Math.random() - 0.48) * (currentVal * 0.004);
            livePrices[key] = parseFloat((currentVal + change).toFixed(2));
        });

        // Sync live market prices directly into MongoDB holdings & positions documents
        for (const [stockName, priceVal] of Object.entries(livePrices)) {
            await HoldingModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
            await PositionModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
        }

        console.log("[Socket] Updated live prices & synced to MongoDB for", Object.keys(livePrices).length, "symbols.");
        io.emit("priceUpdate", livePrices);
    } catch (error) {
        console.log("[Socket] Simulating live price changes...");
        simulatePriceChanges();
    }
}

function simulatePriceChanges() {
    Object.keys(livePrices).forEach(stock => {
        const change = (Math.random() - 0.48) * (livePrices[stock] * 0.004);
        livePrices[stock] = parseFloat((livePrices[stock] + change).toFixed(2));
    });
    io.emit("priceUpdate", livePrices);
}

fetchLivePrices();
setInterval(fetchLivePrices, 2500);

io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    socket.emit("priceUpdate", livePrices);

    socket.on("subscribe", (symbols) => {
        if (Array.isArray(symbols)) {
            symbols.forEach(s => {
                if (symbolMap[s]) subscribedSymbols.add(symbolMap[s]);
            });
            fetchLivePrices();
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});