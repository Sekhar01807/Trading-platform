require("dotenv").config();
const app = require("./app");
const { connectDB, closeDB } = require("./config/db");
const { socketCorsOptions, allowedOrigins } = require("./config/corsOptions");
const MarketTickerService = require("./Services/MarketTickerService");
const { createSecretToken } = require("./util/SecretToken");
const logger = require("./util/logger");

const PORT = process.env.PORT || 3000;

let server = null;
let io = null;

const startServer = async () => {
    try {
        await connectDB();

        server = app.listen(PORT, () => {
            logger.info(`[PulseTrade] HTTP server listening on port ${PORT}`);
            logger.info(`[PulseTrade] Swagger UI available at http://localhost:${PORT}/api-docs`);
            logger.info(`[PulseTrade] Health check available at http://localhost:${PORT}/health`);
        });

        io = require("socket.io")(server, {
            cors: socketCorsOptions,
            pingTimeout: 30000,
            pingInterval: 10000
        });

        MarketTickerService.initialize(io);

        // Graceful Process Termination Handlers
        const handleShutdown = async (signal) => {
            logger.info(`[PulseTrade] Received ${signal}. Starting graceful shutdown...`);
            MarketTickerService.stop();

            if (io) {
                io.close(() => logger.info("[PulseTrade] WebSocket server closed."));
            }

            if (server) {
                server.close(async () => {
                    logger.info("[PulseTrade] HTTP server closed.");
                    await closeDB();
                    logger.info("[PulseTrade] Graceful shutdown completed.");
                    process.exit(0);
                });
            } else {
                await closeDB();
                process.exit(0);
            }

            // Force termination if hanging after 10s
            setTimeout(() => {
                logger.error("[PulseTrade] Graceful shutdown timed out. Forcing exit.");
                process.exit(1);
            }, 10000).unref();
        };

        process.on("SIGINT", () => handleShutdown("SIGINT"));
        process.on("SIGTERM", () => handleShutdown("SIGTERM"));

    } catch (err) {
        logger.error("[PulseTrade] Fatal Server Startup Error:", { error: err.message });
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    server,
    io,
    createSecretToken,
    allowedOrigins
};