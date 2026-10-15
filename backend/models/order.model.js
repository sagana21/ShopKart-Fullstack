const mongoose = require("mongoose");

// An Order is a HISTORICAL SNAPSHOT of what was bought, when, at what price.
// (The Cart, by contrast, always points at live Product data.)
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer", // this project's user model is "Customer"
      required: true,
      index: true,
    },

    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true }, // snapshot
        price: { type: Number, required: true }, // snapshot (per unit, in rupees)
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String }, // snapshot
      },
    ],

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    totalAmount: { type: Number, required: true }, // calculated on the server, in rupees

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
      default: "PENDING_PAYMENT",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
