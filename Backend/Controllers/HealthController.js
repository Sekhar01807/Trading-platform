const mongoose = require("mongoose");
const MarketTickerService = require("../Services/MarketTickerService");

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getHealthStatus = async (req, res) => {
    const startTime = Date.now();
    let dbStatus = "disconnected";
    let dbLatencyMs = null;

    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            dbStatus = "connected";
            dbLatencyMs = Date.now() - startTime;
        } else if (mongoose.connection.readyState === 2) {
            dbStatus = "connecting";
        }
    } catch (e) {
        dbStatus = "error";
    }

    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();
    const isHealthy = dbStatus === "connected";

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "healthy" : "degraded",
        service: "pulsetrade-backend-api",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptimeSeconds),
            formatted: formatUptime(uptimeSeconds)
        },
        database: {
            status: dbStatus,
            name: mongoose.connection.name || "pulsetrade",
            latencyMs: dbLatencyMs
        },
        memory: {
            heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
            heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
            rssMB: Number((memoryUsage.rss / 1024 / 1024).toFixed(2))
        },
        environment: process.env.NODE_ENV || "development"
    });
};

module.exports = { getHealthStatus };
