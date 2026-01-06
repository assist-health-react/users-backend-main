const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true, // faster queries
    },

    name: {
      type: String,
    },

    mobileNumber: {
      type: String,
    },
    email: {
      type: String,
    },

    amount: {
      type: Number,
      required: true,
    },

    // Our generated ID (merchantTransactionId)
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // PhonePe payment status:
    // "pending", "success", "failed"
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    platform: {
      type: String,
      enum: ["web", "mobile"],
      default: "web",
    },

    // PhonePe full response (optional)
    gatewayResponse: {
      type: Object,
      default: {},
    },

    // When success → we store PhonePe transaction details
    transactionDetails: {
      type: Object,
      default: {},
    }
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Payment", PaymentSchema);
