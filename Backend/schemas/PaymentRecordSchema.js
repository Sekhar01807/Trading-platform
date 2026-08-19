const { Schema } = require("mongoose");

const PaymentRecordSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    razorpay_payment_id: { 
        type: String, 
        trim: true
    },
    razorpay_order_id: { 
        type: String, 
        required: true,
        trim: true
    },
    razorpay_signature: { 
        type: String, 
        default: null
    },
    amount: { 
        type: Number, 
        required: true,
        min: [0.01, "Amount must be at least ₹0.01"]
    },
    status: { 
        type: String, 
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING",
        index: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

PaymentRecordSchema.index({ razorpay_payment_id: 1 }, { unique: true, sparse: true });
PaymentRecordSchema.index({ razorpay_order_id: 1 }, { unique: true });
PaymentRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = { PaymentRecordSchema };
