const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// The logged-in customer comes ONLY from the auth middleware (req.user, set from the JWT cookie).
// We never read a userId from req.body or req.params.

// POST /wishlist/:productId
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const customer = await Customer.findById(req.user._id);
    if (!customer)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // Duplicate prevention
    if (customer.wishlist.some((id) => id.equals(productId)))
      return res.status(409).json({ success: false, message: "Product already in wishlist" });

    customer.wishlist.push(productId); // store only the ObjectId reference
    await customer.save();

    res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /wishlist
exports.getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    });

    if (!customer)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    // If a product was deleted from the catalog, populate gives null -> drop it
    const wishlist = customer.wishlist.filter(Boolean);

    res.json({ success: true, count: wishlist.length, wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const customer = await Customer.findById(req.user._id);
    if (!customer)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!customer.wishlist.some((id) => id.equals(productId)))
      return res.status(404).json({ success: false, message: "Product not in wishlist" });

    customer.wishlist = customer.wishlist.filter((id) => !id.equals(productId));
    await customer.save();

    res.json({ success: true, message: "Product removed from wishlist" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
