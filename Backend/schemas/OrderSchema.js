const { Schema } = require("mongoose");

const OrderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    qty: Number,
    price: Number,
    mode: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = { OrderSchema };