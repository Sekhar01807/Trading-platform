const { model } = require("mongoose");
const { PaymentRecordSchema } = require("../schemas/PaymentRecordSchema");

const PaymentRecordModel = model("payment_record", PaymentRecordSchema);

module.exports = { PaymentRecordModel };
