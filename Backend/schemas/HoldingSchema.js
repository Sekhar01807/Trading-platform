const { Schema } = require("mongoose");

const HoldingSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    name: { 
        type: String, 
        required: [true, "Stock symbol name is required"],
        uppercase: true,
        trim: true
    },
    qty: { 
        type: Number, 
        required: true,
        min: [0, "Holding quantity cannot be negative"]
    },
    avg: { 
        type: Number, 
        required: true,
        min: [0, "Average purchase cost basis cannot be negative"]
    }, // Cost basis per share
    price: { 
        type: Number, 
        default: 0 
    }, // Current live market price (LTP)
    net: { 
        type: String, 
        default: "+0.00%" 
    },
    day: { 
        type: String, 
        default: "+0.00%" 
    },
    isLoss: { 
        type: Boolean, 
        default: false 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user cannot have duplicate holding documents for the same stock symbol
HoldingSchema.index({ userId: 1, name: 1 }, { unique: true });
HoldingSchema.index({ name: 1 });

module.exports = { HoldingSchema };