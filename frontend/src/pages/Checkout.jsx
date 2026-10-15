import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CheckoutForm from "../components/CheckoutForm";
import OrderSummary from "../components/OrderSummary";
import { useCart } from "../context/CartContext";
import {
  createPaymentOrder,
  verifyPayment,
  reportPaymentFailed,
  getCurrentCustomer,
} from "../services/api";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal, loading, hasStockIssue, clearCart, refreshCart } = useCart();

  const [prefill, setPrefill] = useState(null); // name + phone from the profile
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(null); // payment succeeded but verification call failed
  const completedRef = useRef(false); // stops the "empty cart" screen flashing after success

  useEffect(() => {
    getCurrentCustomer()
      .then(({ data }) => setPrefill({ fullName: data.fullName || "", phone: data.phone || "" }))
      .catch(() => setPrefill({}));
  }, []);

  const confirmPayment = async (payload) => {
    setProcessing(true);
    setError("");
    try {
      const { data } = await verifyPayment(payload);
      completedRef.current = true;
      clearCart(); // backend cart is cleared -> clear the global state too (Navbar -> Cart (0))
      navigate(`/order-success/${data.order._id}`, { replace: true });
    } catch (err) {
      setRetry(payload);
      setError(
        err.response?.data?.message ||
          "We could not confirm your payment. Please retry. Your cart has not been cleared."
      );
      setProcessing(false);
    }
  };

  const handlePlaceOrder = async (shippingAddress) => {
    setProcessing(true);
    setError("");
    setRetry(null);

    // 1) Backend validates cart/stock/prices and creates the Razorpay order
    let data;
    try {
      ({ data } = await createPaymentOrder(shippingAddress));
    } catch (err) {
      if (err.response?.status === 401) return navigate("/login");
      setError(err.response?.data?.message || "Could not place your order. Please try again.");
      refreshCart(); // stock/price may have changed -> show the latest cart
      setProcessing(false);
      return;
    }

    // 2) Load Razorpay Checkout
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setError("Could not load Razorpay. Check your internet connection and try again.");
      setProcessing(false);
      return;
    }

    // 3) Open it
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "ShopKart",
      description: "ShopKart Order",
      order_id: data.razorpayOrderId,
      // NOT proof of payment: just hand the details to the backend to verify
      handler: (response) =>
        confirmPayment({
          shopKartOrderId: data.shopKartOrderId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
      theme: { color: "#4f46e5" },
      modal: {
        ondismiss: () => {
          if (completedRef.current) return;
          setProcessing(false);
          setError("Payment was cancelled. Your cart has not been cleared.");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      console.error("Payment failed", response.error);
      reportPaymentFailed(data.shopKartOrderId).catch(() => {});
      setError("Payment failed. Your cart has not been cleared. Please try again.");
      setProcessing(false);
    });
    rzp.open();
  };

  let content;

  if (loading || !prefill) {
    content = <p className="state-message">Loading checkout...</p>;
  } else if (cartItems.length === 0 && !completedRef.current) {
    // /checkout opened directly with an empty cart
    content = (
      <div className="empty-state">
        <div className="empty-heart">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add something to your cart before checking out.</p>
        <button className="retry-btn" onClick={() => navigate("/products")}>
          Browse Products
        </button>
      </div>
    );
  } else {
    content = (
      <div className="cart-layout">
        <CheckoutForm initialValues={prefill} onSubmit={handlePlaceOrder} submitting={processing}>
          {hasStockIssue && (
            <p className="wishlist-error">
              Some items exceed available stock. <Link to="/cart">Update your cart</Link> first.
            </p>
          )}
          {error && (
            <p className="wishlist-error" role="alert">
              {error}
            </p>
          )}
          {retry ? (
            <button
              type="button"
              className="retry-btn checkout-btn"
              onClick={() => confirmPayment(retry)}
              disabled={processing}
            >
              {processing ? "Verifying payment..." : "Retry Payment Verification"}
            </button>
          ) : (
            <button type="submit" className="retry-btn checkout-btn" disabled={processing || hasStockIssue}>
              {processing ? "Processing..." : "Place Order & Pay"}
            </button>
          )}
          <p className="test-mode-note">Razorpay Test Mode. No real money is charged.</p>
        </CheckoutForm>

        <OrderSummary cartItems={cartItems} subtotal={subtotal} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>Checkout</h1>
        {content}
        <div style={{ textAlign: "center" }}>
          <Link to="/cart" className="back-link">
            ← Back to cart
          </Link>
        </div>
      </div>
    </>
  );
}
