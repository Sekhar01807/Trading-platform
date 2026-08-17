const { Schema } = require("mongoose");
const { TRANSACTION_TYPE, TRANSACTION_STATUS } = require("../config/constants");

const TransactionSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        index: true 
    },
    type: { 
        type: String, 
        enum: Object.values(TRANSACTION_TYPE),
        required: [true, "Transaction type is required"]
    },
    amount: { 
        type: Number, 
        required: [true, "Transaction amount is required"],
        min: [0.01, "Transaction amount must be positive"]
    },
    balanceBefore: { 
        type: Number, 
        required: true 
    },
    balanceAfter: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: Object.values(TRANSACTION_STATUS),
        default: TRANSACTION_STATUS.SUCCESS,
        index: true
    },
    referenceId: { 
        type: String, 
        default: null,
        index: true 
    },
    description: { 
        type: String, 
        default: "" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true 
    }
});

// Fast querying of user's financial audit ledger
TransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = { TransactionSchema };
