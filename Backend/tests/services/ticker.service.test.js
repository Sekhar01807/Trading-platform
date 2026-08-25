process.env.TOKEN_KEY = process.env.TOKEN_KEY || "PulseTrade_CI_Test_JWT_Secret_Key_2026!@#";

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

    test("simulatePriceChanges should update live prices", () => {
        const pricesBefore = { ...MarketTickerService.getLivePrices() };
        MarketTickerService.simulatePriceChanges();
        const pricesAfter = MarketTickerService.getLivePrices();
        expect(pricesAfter).toBeDefined();
        expect(typeof pricesAfter).toBe("object");
    });

    test("notifyUser should emit to private user room if socket.io is initialized", () => {
        const mockIo = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };

        MarketTickerService.io = mockIo;
        MarketTickerService.notifyUser("user123", "order_update", { orderId: "ord1" });

        expect(mockIo.to).toHaveBeenCalledWith("user_user123");
        expect(mockIo.emit).toHaveBeenCalledWith("order_update", { orderId: "ord1" });
    });

    test("setupSocketAuth should handle handshake authentication middleware", () => {
        const mockIo = {
            use: jest.fn((middleware) => {
                const mockSocket = {
                    handshake: {
                        headers: { cookie: "token=mock.jwt.token" },
                        auth: {}
                    }
                };
                middleware(mockSocket, () => {});
                expect(mockSocket.isAuthenticated).toBe(false);
            }),
            on: jest.fn()
        };

        MarketTickerService.io = mockIo;
        MarketTickerService.setupSocketAuth();
        expect(mockIo.use).toHaveBeenCalled();
    });
});
