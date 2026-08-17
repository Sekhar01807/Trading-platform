require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const { socketCorsOptions, allowedOrigins } = require("./config/corsOptions");
const MarketTickerService = require("./Services/MarketTickerService");
const { createSecretToken } = require("./util/SecretToken");

const PORT = process.env.PORT || 3000;

let server = null;
let io = null;

if (require.main === module) {
    server = app.listen(PORT, async () => {
        console.log(`[PulseTrade] Server started on port ${PORT}`);
        try {
            await connectDB();
        } catch (err) {
            console.error("[PulseTrade] Fatal Database Connection Error:", err.message);
        }
    });

    io = require("socket.io")(server, {
        cors: socketCorsOptions
    });

    MarketTickerService.initialize(io);
}

module.exports = {
    app,
    server,
    io,
    createSecretToken,
    allowedOrigins
};