// Structured JSON Logger for Enterprise Observability

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const currentLogLevel = process.env.NODE_ENV === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const formatLog = (level, message, context = {}) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: "pulsetrade-api",
        environment: process.env.NODE_ENV || "development",
        message,
        ...context
    });
};

const logger = {
    debug(message, context) {
        if (currentLogLevel <= LOG_LEVELS.DEBUG) {
            console.debug(formatLog("DEBUG", message, context));
        }
    },
    info(message, context) {
        if (currentLogLevel <= LOG_LEVELS.INFO) {
            console.log(formatLog("INFO", message, context));
        }
    },
    warn(message, context) {
        if (currentLogLevel <= LOG_LEVELS.WARN) {
            console.warn(formatLog("WARN", message, context));
        }
    },
    error(message, context) {
        if (currentLogLevel <= LOG_LEVELS.ERROR) {
            console.error(formatLog("ERROR", message, context));
        }
    }
};

module.exports = logger;
