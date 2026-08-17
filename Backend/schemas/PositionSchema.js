const { Schema } = require("mongoose");
const { PRODUCT_TYPE } = require("../config/constants");

const PositionSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    product: { 
        type: String, 
        enum: Object.values(PRODUCT_TYPE),
        default: PRODUCT_TYPE.CNC 
    },
    name: { 
        type: String, 
        required: true,
        uppercase: true,
        trim: true
    },
    qty: { 
        type: Number, 
        required: true 
    },
    avg: { 
        type: Number, 
        required: true 
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

PositionSchema.index({ userId: 1, name: 1 });
PositionSchema.index({ name: 1 });

module.exports = { PositionSchema };
