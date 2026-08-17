const { model } = require("mongoose");
const { TransactionSchema } = require("../schemas/TransactionSchema");

const TransactionModel = model("transaction", TransactionSchema);

module.exports = { TransactionModel };
