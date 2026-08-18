const mongoose = require("mongoose");
const logger = require("./logger");

/**
 * Executes a callback within a MongoDB multi-document session transaction.
 * Automatically commits on success and aborts on error.
 * If the MongoDB instance is a standalone non-replica server, falls back gracefully.
 * 
 * @param {Function} callback - Async function receiving the session (or null if non-replica)
 * @returns {Promise<any>} Result returned by the callback
 */
const runInTransaction = async (callback) => {
    let session = null;
    try {
        session = await mongoose.startSession();
    } catch (err) {
        logger.debug("[TransactionHelper] Sessions not available, proceeding without session", { error: err.message });
        return await callback(null);
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

        // If the database is a standalone instance that doesn't support transactions
        if (error.message && (
            error.message.includes("Transaction numbers are only allowed on a replica set member") ||
            error.message.includes("Standalone servers do not support transactions")
        )) {
            logger.warn("[TransactionHelper] Replica set transaction unsupported on this deployment. Retrying without session transaction.", {
                error: error.message
            });
            return await callback(null);
        }

        throw error;
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (endErr) {
                // Cleaned up
            }
        }
    }
};

module.exports = { runInTransaction };
