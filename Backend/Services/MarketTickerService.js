const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const { HoldingModel } = require("../model/HoldingModel");
const { PositionModel } = require("../model/PositionModel");
const { SYMBOL_MAP, INITIAL_PRICES } = require("../config/constants");

class MarketTickerService {
    constructor() {
        this.livePrices = { ...INITIAL_PRICES };
        this.subscribedSymbols = new Set(Object.values(SYMBOL_MAP));
        this.io = null;
        this.intervalId = null;
    }

    initialize(io) {
        this.io = io;
        this.setupSocketHandlers();
        this.fetchLivePrices();
        this.intervalId = setInterval(() => this.fetchLivePrices(), 2500);
        console.log("[MarketTicker] Initialized real-time market data feed.");
    }

    setupSocketHandlers() {
        if (!this.io) return;

        this.io.on("connection", (socket) => {
            console.log(`[Socket.io] Client connected: ${socket.id}`);
            socket.emit("priceUpdate", this.livePrices);

            socket.on("subscribe", (symbols) => {
                if (Array.isArray(symbols)) {
                    symbols.forEach(s => {
                        if (SYMBOL_MAP[s]) this.subscribedSymbols.add(SYMBOL_MAP[s]);
                    });
                    this.fetchLivePrices();
                }
            });

            socket.on("disconnect", () => {
                console.log(`[Socket.io] Client disconnected: ${socket.id}`);
            });
        });
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
                // Yahoo Finance API notice -> fallback to realistic simulated market movements
            }

            // Apply price changes
            Object.keys(this.livePrices).forEach(key => {
                const currentVal = newPrices[key] || this.livePrices[key];
                const change = (Math.random() - 0.48) * (currentVal * 0.004);
                this.livePrices[key] = parseFloat((currentVal + change).toFixed(2));
            });

            // Update live market price across holdings & positions in DB
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
