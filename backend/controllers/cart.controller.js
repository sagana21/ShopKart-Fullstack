const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// The customer always comes from the auth middleware (req.user, from the JWT cookie).

// Load the customer's cart with each Product populated (latest price/stock from Product).
// Items whose product was deleted from the catalog come back with product = null -> drop them.
const loadCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name price category image stock",
  });
  return customer.cart.filter((item) => item.product);
};

const findItem = (customer, productId) =>
  customer.cart.find((item) => item.product.equals(productId));

// POST /cart/:productId  -> add (qty 1) or increase existing quantity by 1
exports.addToCart = async (req, res) => {
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

    const item = findItem(customer, productId);
    const newQuantity = item ? item.quantity + 1 : 1;

    // Stock validation
    if (product.stock < 1)
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    if (newQuantity > product.stock)
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit${product.stock > 1 ? "s" : ""} available`,
      });

    if (item) item.quantity = newQuantity; // same product twice -> one row, quantity + 1
    else customer.cart.push({ product: productId, quantity: 1 });

    await customer.save();

    res.json({ success: true, message: "Cart updated", cart: await loadCart(customer._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /cart
exports.getCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user._id);
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /cart/:productId   body: { quantity }
exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    if (typeof quantity !== "number" || !Number.isInteger(quantity))
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });

    if (quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    const customer = await Customer.findById(req.user._id);
    if (!customer)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const item = findItem(customer, productId);
    if (!item)
      return res.status(404).json({ success: false, message: "Product not in cart" });

    if (quantity > product.stock)
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available`,
      });

    item.quantity = quantity;
    await customer.save();

    res.json({ success: true, message: "Quantity updated", cart: await loadCart(customer._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /cart/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const customer = await Customer.findById(req.user._id);
    if (!customer)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!findItem(customer, productId))
      return res.status(404).json({ success: false, message: "Product not in cart" });

    customer.cart = customer.cart.filter((item) => !item.product.equals(productId));
    await customer.save();

    res.json({ success: true, message: "Product removed from cart", cart: await loadCart(customer._id) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
