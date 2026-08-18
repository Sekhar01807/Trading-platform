/**
 * Financial Currency & Monetary Precision Utility
 * 
 * Provides integer-paise and 2-decimal rounded currency arithmetic
 * to prevent IEEE 754 floating-point inaccuracies in financial calculations.
 */

/**
 * Rounds a monetary amount to 2 decimal places.
 * @param {number} amount 
 * @returns {number}
 */
const roundCurrency = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return 0;
    return Number((Math.round(Number(amount) * 100) / 100).toFixed(2));
};

/**
 * Converts INR Rupees to integer Paise (e.g. ₹50.25 -> 5025 paise).
 * @param {number} rupees 
 * @returns {number}
 */
const toPaise = (rupees) => {
    if (isNaN(rupees) || rupees === null || rupees === undefined) return 0;
    return Math.round(Number(rupees) * 100);
};

/**
 * Converts integer Paise back to INR Rupees (e.g. 5025 paise -> 50.25).
 * @param {number} paise 
 * @returns {number}
 */
const toRupees = (paise) => {
    if (isNaN(paise) || paise === null || paise === undefined) return 0;
    return Number((Number(paise) / 100).toFixed(2));
};

/**
 * Formats a monetary number into standard Indian numbering system (e.g. ₹1,50,000.00).
 * @param {number} amount 
 * @returns {string}
 */
const formatINR = (amount) => {
    const val = roundCurrency(amount);
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

module.exports = {
    roundCurrency,
    toPaise,
    toRupees,
    formatINR
};
