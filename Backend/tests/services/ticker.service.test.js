const MarketTickerService = require("../../Services/MarketTickerService");
const { INITIAL_PRICES } = require("../../config/constants");

jest.setTimeout(30000);

describe("Domain Service: MarketTickerService & Real-time Feeds", () => {
    test("getLivePrices should return live prices snapshot with stock symbols", () => {
        const prices = MarketTickerService.getLivePrices();
        expect(prices).toBeDefined();
        expect(typeof prices).toBe("object");
        expect(prices["INFY"]).toBeGreaterThan(0);
        expect(prices["RELIANCE"]).toBeGreaterThan(0);
        expect(prices["TATAPOWER"]).toBeGreaterThan(0);
    });

    test("getHistoricalData should return historical candlestick chart points", async () => {
        const history = await MarketTickerService.getHistoricalData("INFY", "1mo", "1d");
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].close).toBeDefined();
        expect(history[0].time).toBeDefined();
    });

    test("setupSocketAuth should handle handshake authentication middleware", () => {
        const mockIo = {
            use: jest.fn((middleware) => {
                // Call middleware with mock socket
                const mockSocket = {
                    handshake: {
                        headers: { cookie: "token=mock.token" },
                        auth: {}
                    }
                };
                middleware(mockSocket, () => {});
                expect(mockSocket.isAuthenticated !== undefined).toBe(true);
            }),
            on: jest.fn()
        };

        const tickerService = new MarketTickerService.constructor();
        tickerService.io = mockIo;
        tickerService.setupSocketAuth();
        expect(mockIo.use).toHaveBeenCalled();
    });
});
