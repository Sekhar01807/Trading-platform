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
const authRoute = require("./Routes/AuthRoute");

const PORT = process.env.PORT || 3000;
const ATLASDB_URL = process.env.ATLASDB_URL;

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

// Seed default initial data if DB is empty
async function seedInitialData() {
    try {
        const holdingsCount = await HoldingModel.countDocuments();
        if (holdingsCount === 0) {
            console.log("Seeding initial holdings data into zerodha DB...");
            await HoldingModel.insertMany([
                { name: "BHARTIARTL", qty: 2, avg: 538.05, price: 541.15, net: "+0.58%", day: "+2.99%", isLoss: false },
                { name: "HDFCBANK", qty: 2, avg: 1383.4, price: 1522.35, net: "+10.04%", day: "+0.11%", isLoss: false },
                { name: "HINDUNILVR", qty: 1, avg: 2335.85, price: 2417.4, net: "+3.49%", day: "+0.21%", isLoss: false },
                { name: "INFY", qty: 1, avg: 1350.5, price: 1555.45, net: "+15.18%", day: "-1.60%", isLoss: true },
                { name: "ITC", qty: 5, avg: 202.0, price: 207.9, net: "+2.92%", day: "+0.80%", isLoss: false },
                { name: "KPITTECH", qty: 5, avg: 250.3, price: 266.45, net: "+6.45%", day: "+3.54%", isLoss: false },
                { name: "M&M", qty: 2, avg: 809.9, price: 779.8, net: "-3.72%", day: "-0.01%", isLoss: true },
                { name: "RELIANCE", qty: 1, avg: 2193.7, price: 2112.4, net: "-3.71%", day: "+1.44%", isLoss: false },
                { name: "SBIN", qty: 4, avg: 324.35, price: 430.2, net: "+32.63%", day: "-0.34%", isLoss: true },
                { name: "SGBMAY29", qty: 2, avg: 4727.0, price: 4719.0, net: "-0.17%", day: "+0.15%", isLoss: false },
                { name: "TATAPOWER", qty: 5, avg: 104.2, price: 124.15, net: "+19.15%", day: "-0.24%", isLoss: true },
                { name: "TCS", qty: 1, avg: 3041.7, price: 3194.8, net: "+5.03%", day: "-0.25%", isLoss: true },
                { name: "WIPRO", qty: 4, avg: 489.3, price: 577.75, net: "+18.08%", day: "+0.32%", isLoss: false }
            ]);
        }

        const positionsCount = await PositionModel.countDocuments();
        if (positionsCount === 0) {
            console.log("Seeding initial positions data into zerodha DB...");
            await PositionModel.insertMany([
                { product: "CNC", name: "EVEREADY", qty: 2, avg: 316.27, price: 312.35, net: "+0.58%", day: "-1.24%", isLoss: true },
                { product: "CNC", name: "JUBLFOOD", qty: 1, avg: 3124.75, price: 3082.65, net: "+10.04%", day: "-1.35%", isLoss: true }
            ]);
        }
    } catch (err) {
        console.error("Error seeding initial data:", err);
    }
}

app.get("/allHoldings", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        let holdings = [];
        if (userId) {
            holdings = await HoldingModel.find({ userId });
        }
        if (holdings.length === 0) {
            holdings = await HoldingModel.find();
        }
        res.json(holdings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching holdings" });
    }
});

app.get("/allPositions", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        let positions = [];
        if (userId) {
            positions = await PositionModel.find({ userId });
        }
        if (positions.length === 0) {
            positions = await PositionModel.find();
        }
        res.json(positions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching positions" });
    }
});

app.get("/allOrders", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const filter = userId ? { userId } : {};
        const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

app.post("/newOrders", async (req, res) => {
    try {
        const userId = getUserIdFromReq(req);
        const { name, qty, price, mode } = req.body;

        if (!name || !qty || !price || !mode) {
            return res.status(400).json({ message: "All order fields are required" });
        }

        let newOrder = new OrderModel({
            userId: userId || null,
            name,
            qty: Number(qty),
            price: Number(price),
            mode,
        });
        await newOrder.save();

        if (mode === "BUY") {
            const filter = userId ? { userId, name } : { name };
            let holding = await HoldingModel.findOne(filter);
            if (holding) {
                const totalQty = holding.qty + Number(qty);
                const totalCost = (holding.qty * holding.avg) + (Number(qty) * Number(price));
                holding.qty = totalQty;
                holding.avg = Number((totalCost / totalQty).toFixed(2));
                holding.price = Number(price);
                await holding.save();
            } else {
                await HoldingModel.create({
                    userId: userId || null,
                    name,
                    qty: Number(qty),
                    avg: Number(price),
                    price: Number(price),
                    net: "+0.00%",
                    day: "+0.00%",
                    isLoss: false
                });
            }
        } else if (mode === "SELL") {
            const filter = userId ? { userId, name } : { name };
            let holding = await HoldingModel.findOne(filter);
            if (holding) {
                if (holding.qty > Number(qty)) {
                    holding.qty -= Number(qty);
                    await holding.save();
                } else {
                    await HoldingModel.deleteOne({ _id: holding._id });
                }
            }
        }

        res.status(201).json({ message: "Order added successfully!", success: true, order: newOrder });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Failed to process order" });
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
            await seedInitialData();
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
    "JUBLFOOD": "JUBLFOOD.NS"
};

let livePrices = {
    "BHARTIARTL": 541.15,
    "HDFCBANK": 1522.35,
    "HINDUNILVR": 2417.4,
    "INFY": 1555.45,
    "ITC": 207.9,
    "KPITTECH": 266.45,
    "M&M": 779.8,
    "RELIANCE": 2112.4,
    "SBIN": 430.2,
    "SGBMAY29": 4719.0,
    "TATAPOWER": 124.15,
    "TCS": 3194.8,
    "WIPRO": 577.75,
    "EVEREADY": 312.35,
    "JUBLFOOD": 3082.65
};

let subscribedSymbols = new Set(Object.values(symbolMap));

async function fetchLivePrices() {
    try {
        const symbols = Array.from(subscribedSymbols);
        if (symbols.length === 0) return;

        console.log(`[Socket] Fetching live stock market prices for ${symbols.length} symbols...`);

        const results = await yahooFinance.quote(symbols);
        const newPrices = {};

        results.forEach(quote => {
            const originalKey = Object.keys(symbolMap).find(key => symbolMap[key] === quote.symbol);
            if (originalKey) {
                newPrices[originalKey] = quote.regularMarketPrice;
            }
        });

        Object.keys(livePrices).forEach(key => {
            if (!symbolMap[key]) {
                const change = (Math.random() - 0.5) * 0.1;
                livePrices[key] = parseFloat((livePrices[key] + change).toFixed(2));
            }
        });

        livePrices = { ...livePrices, ...newPrices };

        // Sync live market prices directly into MongoDB holdings & positions documents
        for (const [stockName, priceVal] of Object.entries(livePrices)) {
            await HoldingModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
            await PositionModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
        }

        console.log("[Socket] Updated live prices & synced to MongoDB:", Object.keys(newPrices).length, "symbols updated.");
        io.emit("priceUpdate", livePrices);
    } catch (error) {
        console.log("[Socket] Yahoo API fallback -> simulating live price changes...");
        simulatePriceChanges();
    }
}

function simulatePriceChanges() {
    Object.keys(livePrices).forEach(stock => {
        const change = (Math.random() - 0.5) * 0.8;
        livePrices[stock] = parseFloat((livePrices[stock] + change).toFixed(2));
    });
    io.emit("priceUpdate", livePrices);
}

fetchLivePrices();
setInterval(fetchLivePrices, 10000);

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