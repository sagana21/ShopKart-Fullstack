const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },

    // Lab 04: references to Product documents (NOT copies of products)
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Lab 05: a product reference + how many units. No price/subtotal stored here:
    // price always comes from the Product, subtotal is derived on the frontend.
    cart: [
      {
        _id: false,
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Customer", customerSchema);
