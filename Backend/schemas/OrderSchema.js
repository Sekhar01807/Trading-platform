const { Schema } = require("mongoose");
const { ORDER_STATUS, ORDER_MODE, PRODUCT_TYPE, ORDER_TYPE } = require("../config/constants");

const OrderSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    name: { 
        type: String, 
        required: [true, "Instrument symbol is required"],
        uppercase: true,
        trim: true
    },
    qty: { 
        type: Number, 
        required: [true, "Order quantity is required"],
        min: [1, "Order quantity must be at least 1"]
    },
    price: { 
        type: Number, 
        required: [true, "Execution price is required"],
        min: [0.01, "Execution price must be greater than zero"]
    },
    requestedPrice: {
        type: Number,
        default: 0
    },
    executedPrice: {
        type: Number,
        default: 0
    },
    marketPrice: {
        type: Number,
        default: 0
    },
    mode: { 
        type: String, 
        enum: Object.values(ORDER_MODE),
        required: [true, "Order mode (BUY or SELL) is required"]
    },
    productType: {
        type: String,
        enum: Object.values(PRODUCT_TYPE),
        default: PRODUCT_TYPE.CNC
    },
    orderType: {
        type: String,
        enum: Object.values(ORDER_TYPE),
        default: ORDER_TYPE.MARKET
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.EXECUTED,
        index: true
    },
    failureReason: {
        type: String,
        default: null
    },
    totalCost: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound indexes for performant query filtering and sorting
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1 });

module.exports = { OrderSchema };