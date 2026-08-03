const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

async function test() {
    try {
        const result = await yahooFinance.quote("INFY.NS");
        console.log("Success! Price:", result.regularMarketPrice);
    } catch (e) {
        console.error("Caught error:", e.message);
    }
}
test();
