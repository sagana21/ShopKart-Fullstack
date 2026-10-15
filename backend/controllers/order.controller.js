const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const getRazorpay = require("../config/razorpay");

const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

// ---------- helpers ----------

// Returns { value } with cleaned address, or { error } with a message.
const validateShippingAddress = (input) => {
  if (!input || typeof input !== "object")
    return { error: "Shipping address is required" };

  const clean = {};
  for (const field of ["fullName", "phone", "addressLine1", "city", "state", "pincode"]) {
    const v = typeof input[field] === "string" ? input[field].trim() : "";
    if (!v) return { error: `Shipping ${field} is required` };
    clean[field] = v;
  }

  const digits = clean.phone.replace(/[\s-]/g, "").replace(/^\+91/, "");
  if (!/^[6-9]\d{9}$/.test(digits))
    return { error: "Phone must be a valid 10-digit mobile number" };
  clean.phone = digits;

  if (!/^\d{6}$/.test(clean.pincode))
    return { error: "Pincode must contain 6 digits" };

  return { value: clean };
};

const sendRazorpayConfigError = (err, res) => {
  if (err.code === "RAZORPAY_NOT_CONFIGURED")
    return res.status(500).json({ success: false, message: "Payment gateway is not configured" });
  return null;
};

// ---------- POST /orders/create-payment-order ----------
// Body: { shippingAddress }.  Anything else (prices, totalAmount, items) is IGNORED.
exports.createPaymentOrder = async (req, res) => {
  try {
    const { value: shippingAddress, error } = validateShippingAddress(req.body.shippingAddress);
    if (error) return res.status(400).json({ success: false, message: error });

    // Load the cart with the LATEST product data
    const customer = await Customer.findById(req.user._id).populate("cart.product");
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!customer.cart.length)
      return res.status(400).json({ success: false, message: "Your cart is empty" });

    const items = [];
    let totalPaise = 0; // integer maths avoids floating point drift

    for (const entry of customer.cart) {
      const product = entry.product;

      // product deleted after it was added to the cart
      if (!product)
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Please review your cart.",
        });

      if (product.stock < 1)
        return res.status(400).json({ success: false, message: `${product.name} is out of stock.` });

      if (entry.quantity > product.stock)
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: entry.quantity,
        image: product.image,
      });
      totalPaise += Math.round(product.price * 100) * entry.quantity;
    }

    const totalAmount = totalPaise / 100;

    // 1) Persist the pending ShopKart order (cart is NOT touched)
    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // 2) Create the Razorpay order (amount in paise)
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: totalPaise,
        currency: "INR",
        receipt: order._id.toString(),
      });
    } catch (err) {
      await Order.findByIdAndDelete(order._id); // don't leave a dead pending order behind
      if (sendRazorpayConfigError(err, res)) return;
      console.error("Razorpay order error:", err?.error || err.message);
      return res.status(502).json({ success: false, message: "Could not start payment. Please try again." });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // paise
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // Key ID is public; Key SECRET never leaves the server
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- POST /orders/verify-payment ----------
exports.verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every((v) => typeof v === "string" && v))
      return res.status(400).json({ success: false, message: "Missing payment details" });

    const order = await Order.findById(shopKartOrderId);
    if (!order || !order.user.equals(req.user._id))
      return res.status(404).json({ success: false, message: "Order not found" });

    // Already confirmed (e.g. double click / retry): return it, do nothing else
    if (order.paymentStatus === "PAID") return res.json({ success: true, order });

    // The browser's order id must match the one WE stored
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id)
      return res.status(400).json({ success: false, message: "Invalid payment signature" });

    // HMAC SHA256 over  <trusted razorpayOrderId from DB> | <payment id>
    if (!process.env.RAZORPAY_KEY_SECRET)
      return res.status(500).json({ success: false, message: "Payment gateway is not configured" });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order.razorpayOrderId + "|" + razorpay_payment_id)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!valid)
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    // invalid -> order stays unpaid, cart untouched

    // Valid: mark paid + placed
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Only now clear the cart
    await Customer.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });

    res.json({ success: true, message: "Payment verified. Order placed.", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- POST /orders/payment-failed ----------
// Called by React on Razorpay's "payment.failed" event. Never touches the cart.
exports.markPaymentFailed = async (req, res) => {
  try {
    const { shopKartOrderId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findById(shopKartOrderId);
    if (!order || !order.user.equals(req.user._id))
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.paymentStatus === "PENDING") {
      order.paymentStatus = "FAILED"; // status stays PENDING_PAYMENT; a later success can still verify
      await order.save();
    }
    res.json({ success: true, message: "Payment failure recorded. Your cart has not been cleared." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- GET /orders ----------
// Current user's orders, newest first. Abandoned checkouts (never paid) are hidden.
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: { $ne: "PENDING_PAYMENT" } }).sort({
      createdAt: -1,
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- GET /orders/:id ----------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findById(id);
    // Someone else's order looks exactly like a missing one (404) -> no ID guessing
    if (!order || !order.user.equals(req.user._id))
      return res.status(404).json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ---------- PATCH /orders/:id/status  (BONUS, development only) ----------
// Moves a PAID order one step forward: PLACED -> CONFIRMED -> SHIPPED -> DELIVERED.
exports.advanceOrderStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production")
      return res.status(404).json({ success: false, message: "Not found" });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid order ID" });

    const order = await Order.findById(id);
    if (!order || !order.user.equals(req.user._id))
      return res.status(404).json({ success: false, message: "Order not found" });

    if (order.paymentStatus !== "PAID")
      return res.status(400).json({ success: false, message: "Only paid orders can progress" });

    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx === -1 || idx === STATUS_FLOW.length - 1)
      return res.status(400).json({ success: false, message: "Order is already delivered" });

    order.status = STATUS_FLOW[idx + 1];
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
