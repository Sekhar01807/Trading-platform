require("dotenv").config();
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const jwt = require("jsonwebtoken");


const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const mongoose = require("mongoose");

const { HoldingModel } = require("./model/HoldingModel");
const { PositionModel } = require("./model/PositionModel");
const { OrderModel } = require("./model/OrderModel");

const PORT = process.env.PORT || 3000;
const ATLASDB_URL = process.env.ATLASDB_URL;

const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Dashboard and Frontend ports
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

// app.get("/addHoldings", async (req, res) => {
//     let tempHoldings = [
//         {
//             name: "BHARTIARTL",
//             qty: 2,
//             avg: 538.05,
//             price: 541.15,
//             net: "+0.58%",
//             day: "+2.99%",
//         },
//         {
//             name: "HDFCBANK",
//             qty: 2,
//             avg: 1383.4,
//             price: 1522.35,
//             net: "+10.04%",
//             day: "+0.11%",
//         },
//         {
//             name: "HINDUNILVR",
//             qty: 1,
//             avg: 2335.85,
//             price: 2417.4,
//             net: "+3.49%",
//             day: "+0.21%",
//         },
//         {
//             name: "INFY",
//             qty: 1,
//             avg: 1350.5,
//             price: 1555.45,
//             net: "+15.18%",
//             day: "-1.60%",
//             isLoss: true,
//         },
//         {
//             name: "ITC",
//             qty: 5,
//             avg: 202.0,
//             price: 207.9,
//             net: "+2.92%",
//             day: "+0.80%",
//         },
//         {
//             name: "KPITTECH",
//             qty: 5,
//             avg: 250.3,
//             price: 266.45,
//             net: "+6.45%",
//             day: "+3.54%",
//         },
//         {
//             name: "M&M",
//             qty: 2,
//             avg: 809.9,
//             price: 779.8,
//             net: "-3.72%",
//             day: "-0.01%",
//             isLoss: true,
//         },
//         {
//             name: "RELIANCE",
//             qty: 1,
//             avg: 2193.7,
//             price: 2112.4,
//             net: "-3.71%",
//             day: "+1.44%",
//         },
//         {
//             name: "SBIN",
//             qty: 4,
//             avg: 324.35,
//             price: 430.2,
//             net: "+32.63%",
//             day: "-0.34%",
//             isLoss: true,
//         },
//         {
//             name: "SGBMAY29",
//             qty: 2,
//             avg: 4727.0,
//             price: 4719.0,
//             net: "-0.17%",
//             day: "+0.15%",
//         },
//         {
//             name: "TATAPOWER",
//             qty: 5,
//             avg: 104.2,
//             price: 124.15,
//             net: "+19.15%",
//             day: "-0.24%",
//             isLoss: true,
//         },
//         {
//             name: "TCS",
//             qty: 1,
//             avg: 3041.7,
//             price: 3194.8,
//             net: "+5.03%",
//             day: "-0.25%",
//             isLoss: true,
//         },
//         {
//             name: "WIPRO",
//             qty: 4,
//             avg: 489.3,
//             price: 577.75,
//             net: "+18.08%",
//             day: "+0.32%",
//         },
//     ];

//     await HoldingModel.insertMany(tempHoldings);
//     res.send("Holdings added successfully!");

// });

// app.get("/getPositions", async (req, res) => {
//    let tempPositions = [
//     {
//         product: "CNC",
//         name: "EVEREADY",
//         qty: 2,
//         avg: 316.27,
//         price: 312.35,
//         net: "+0.58%",
//         day: "-1.24%",
//         isLoss: true,
//     },
//     {
//         product: "CNC",
//         name: "JUBLFOOD",
//         qty: 1,
//         avg: 3124.75,
//         price: 3082.65,
//         net: "+10.04%",
//         day: "-1.35%",
//         isLoss: true,
//     },
//    ];

//    await PositionModel.insertMany(tempPositions);
//    res.send("Positions added successfully!");
// });

app.get("/allHoldings", async (req, res) => {
    const holdings = await HoldingModel.find();
    res.json(holdings);
});

app.get("/allPositions", async (req, res) => {
    const positions = await PositionModel.find();
    res.json(positions);
});

app.get("/allOrders", async (req, res) => {
    const orders = await OrderModel.find();
    res.json(orders);
});

app.post("/newOrders", async (req, res) => {
    let newOrder = new OrderModel({
        name: req.body.name,
        qty: req.body.qty,
        price: req.body.price,
        mode: req.body.mode,
    });
    await newOrder.save();
    res.send("Order added successfully!");

});



const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    mongoose.connect(ATLASDB_URL)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((error) => {
            console.log(error);
        });
});

const io = require("socket.io")(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

// Mapping of internal names to Yahoo Finance symbols
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
        console.log(`[Socket] Fetching live prices for ${symbols.length} symbols...`);

        const results = await yahooFinance.quote(symbols);
        const newPrices = {};

        results.forEach(quote => {
            const originalKey = Object.keys(symbolMap).find(key => symbolMap[key] === quote.symbol);
            if (originalKey) {
                newPrices[originalKey] = quote.regularMarketPrice;
            }
        });

        // Simulating for SGB or if results are missing
        Object.keys(livePrices).forEach(key => {
            if (!symbolMap[key]) {
                const change = (Math.random() - 0.5) * 0.1;
                livePrices[key] = parseFloat((livePrices[key] + change).toFixed(2));
            }
        });

        livePrices = { ...livePrices, ...newPrices };
        io.emit("priceUpdate", livePrices);
    } catch (error) {
        console.error("Error fetching live prices:", error.message);
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
    console.log("Client connected for live updates:", socket.id);
    socket.emit("priceUpdate", livePrices); // Send initial prices

    socket.on("subscribe", (symbols) => {
        if (Array.isArray(symbols)) {
            symbols.forEach(s => {
                if (symbolMap[s]) subscribedSymbols.add(symbolMap[s]);
            });
            fetchLivePrices();
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});