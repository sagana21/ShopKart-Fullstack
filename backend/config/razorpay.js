const Razorpay = require("razorpay");

// Created lazily so the server still boots (and Labs 01-05 still work) if the
// Razorpay keys are missing; the payment endpoints then return a clear error.
let instance = null;

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Razorpay keys are not configured on the server");
    err.code = "RAZORPAY_NOT_CONFIGURED";
    throw err;
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET, // backend only, never sent to React
    });
  }
  return instance;
};

module.exports = getRazorpay;
