const mongoose = require("mongoose");
const logger = require("./logger");

/**
 * Executes a callback within a strict MongoDB multi-document session transaction.
 * Automatically commits on success and aborts on error.
 * 
 * FAILS CLOSED: If transactions cannot be started or fail during execution,
 * this function throws an error rather than silently executing business logic
 * without ACID transaction guarantees.
 * 
 * @param {Function} callback - Async function receiving the active session (session: ClientSession)
 * @returns {Promise<any>} Result returned by the callback
 */
const runInTransaction = async (callback) => {
    let session = null;
    try {
        session = await mongoose.startSession();
    } catch (err) {
        logger.error("[TransactionHelper] Failed to acquire MongoDB session", { error: err.message });
        throw {
            statusCode: 500,
            message: "Database transaction failed: Unable to acquire session for transactional operation."
        };
    }

    try {
        session.startTransaction();
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        if (session && session.inTransaction()) {
            try {
                await session.abortTransaction();
            } catch (abortErr) {
                logger.error("[TransactionHelper] Error aborting transaction", { error: abortErr.message });
            }
        }
        // Strictly fail closed: propagate error to caller
        throw error;
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (endErr) {
                // Session cleanup
            }
        }
    }
};

module.exports = { runInTransaction };
