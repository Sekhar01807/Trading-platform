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
        required: true, 
        unique: true,
        trim: true
    },
    razorpay_order_id: { 
        type: String, 
        required: true,
        trim: true,
        index: true
    },
    razorpay_signature: { 
        type: String, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true,
        min: 0.01
    },
    status: { 
        type: String, 
        default: "SUCCESS" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

PaymentRecordSchema.index({ razorpay_payment_id: 1 }, { unique: true });

module.exports = { PaymentRecordSchema };
