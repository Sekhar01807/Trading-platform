const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const jwt = require("jsonwebtoken");
const { getTokenSecret } = require("../util/SecretToken");
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { SYMBOL_MAP, INITIAL_PRICES } = require("../config/constants");
const logger = require("../util/logger");

class MarketTickerService {
    constructor() {
        this.livePrices = { ...INITIAL_PRICES };
        this.subscribedSymbols = new Set(Object.values(SYMBOL_MAP));
        this.io = null;
        this.intervalId = null;
    }

    initialize(io) {
        this.io = io;
        this.setupSocketAuth();
        this.setupSocketHandlers();
        this.fetchLivePrices();
        this.intervalId = setInterval(() => this.fetchLivePrices(), 2500);
        logger.info("[MarketTicker] Initialized real-time market data feed & authenticated socket engine.");
    }

    setupSocketAuth() {
        if (!this.io) return;

        // Socket.IO Handshake Authentication Middleware
        this.io.use((socket, next) => {
            try {
                let token = null;

                // Extract token from cookie handshake
                if (socket.handshake.headers.cookie) {
                    const cookies = socket.handshake.headers.cookie.split(";").reduce((acc, cookie) => {
                        const [key, val] = cookie.trim().split("=");
                        acc[key] = val;
                        return acc;
                    }, {});
                    token = cookies.token;
                }

                // Or extract from auth payload
                if (!token && socket.handshake.auth && socket.handshake.auth.token) {
                    token = socket.handshake.auth.token;
                }

                if (token) {
                    try {
                        const decoded = jwt.verify(token, getTokenSecret());
                        socket.userId = decoded.id;
                        socket.isAuthenticated = true;
                    } catch (e) {
                        socket.isAuthenticated = false;
                    }
                } else {
                    socket.isAuthenticated = false;
                }

                next();
            } catch (err) {
                next();
            }
        });
    }

    setupSocketHandlers() {
        if (!this.io) return;

        this.io.on("connection", (socket) => {
            const clientInfo = {
                socketId: socket.id,
                isAuthenticated: socket.isAuthenticated,
                userId: socket.userId || "anonymous"
            };

            logger.info("[Socket.io] Client connected", clientInfo);

            // Join private user room if authenticated
            if (socket.userId) {
                socket.join(`user_${socket.userId}`);
            }

            // Send initial live price snapshot
            socket.emit("priceUpdate", this.livePrices);

            // Dynamic Symbol Subscriptions
            socket.on("subscribe", (symbols) => {
                if (Array.isArray(symbols)) {
                    symbols.forEach(s => {
                        const cleanSym = String(s).trim().toUpperCase();
                        if (SYMBOL_MAP[cleanSym]) {
                            this.subscribedSymbols.add(SYMBOL_MAP[cleanSym]);
                        }
                    });
                    this.fetchLivePrices();
                }
            });

            socket.on("unsubscribe", (symbols) => {
                if (Array.isArray(symbols)) {
                    symbols.forEach(s => {
                        const cleanSym = String(s).trim().toUpperCase();
                        if (SYMBOL_MAP[cleanSym]) {
                            this.subscribedSymbols.delete(SYMBOL_MAP[cleanSym]);
                        }
                    });
                }
            });

            socket.on("disconnect", () => {
                logger.info("[Socket.io] Client disconnected", { socketId: socket.id });
            });
        });
    }

    /**
     * Broadcasts private event to specific authenticated user
     */
    notifyUser(userId, eventName, payload) {
        if (this.io && userId) {
            this.io.to(`user_${userId}`).emit(eventName, payload);
        }
    }

    async fetchLivePrices() {
        try {
            Object.values(SYMBOL_MAP).forEach(sym => this.subscribedSymbols.add(sym));
            const symbols = Array.from(this.subscribedSymbols);
            if (symbols.length === 0) return;

            let newPrices = {};
            try {
                const results = await yahooFinance.quote(symbols);
                if (Array.isArray(results)) {
                    results.forEach(quote => {
                        const originalKey = Object.keys(SYMBOL_MAP).find(key => SYMBOL_MAP[key] === quote.symbol);
                        if (originalKey && quote.regularMarketPrice) {
                            const tick = (Math.random() - 0.48) * (quote.regularMarketPrice * 0.003);
                            newPrices[originalKey] = parseFloat((quote.regularMarketPrice + tick).toFixed(2));
                        }
                    });
                }
            } catch (e) {
                // Yahoo Finance API notice fallback
            }

            // Apply simulated micro-ticks
            Object.keys(this.livePrices).forEach(key => {
                const currentVal = newPrices[key] || this.livePrices[key];
                const change = (Math.random() - 0.48) * (currentVal * 0.004);
                this.livePrices[key] = parseFloat((currentVal + change).toFixed(2));
            });

            // Update database live prices
            for (const [stockName, priceVal] of Object.entries(this.livePrices)) {
                await HoldingModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
                await PositionModel.updateMany({ name: stockName }, { $set: { price: priceVal } });
            }

            if (this.io) {
                this.io.emit("priceUpdate", this.livePrices);
            }
        } catch (error) {
            this.simulatePriceChanges();
        }
    }

    simulatePriceChanges() {
        Object.keys(this.livePrices).forEach(stock => {
            const change = (Math.random() - 0.48) * (this.livePrices[stock] * 0.004);
            this.livePrices[stock] = parseFloat((this.livePrices[stock] + change).toFixed(2));
        });
        if (this.io) {
            this.io.emit("priceUpdate", this.livePrices);
        }
    }

    getLivePrices() {
        return this.livePrices;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

module.exports = new MarketTickerService();
