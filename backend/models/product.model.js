const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: {
      type: Number,
      required: true,
      validate: { validator: v => v > 0, message: "Price must be greater than 0" },
    },
    category: { type: String, required: true },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Product", productSchema);
