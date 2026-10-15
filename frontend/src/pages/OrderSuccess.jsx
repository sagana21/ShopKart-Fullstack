import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getOrderById } from "../services/api";
import { rupees } from "../utils";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderById(id)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || "Unable to load this order."));
  }, [id]);

  let content;
  if (error) {
    content = <p className="state-message error">{error}</p>;
  } else if (!order) {
    content = <p className="state-message">Loading your order...</p>;
  } else if (order.paymentStatus !== "PAID") {
    content = (
      <div className="state-message error">
        <h2>Payment not completed</h2>
        <p>This order has not been paid, so it has not been placed.</p>
        <Link to="/cart" className="retry-btn" style={{ display: "inline-block", textDecoration: "none" }}>
          Back to Cart
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2>Order Placed Successfully</h2>
        <p className="success-label">Order ID</p>
        <p className="success-value">{order._id}</p>
        <p className="success-label">Total</p>
        <p className="success-value">{rupees(order.totalAmount)}</p>
        <p className="success-label">Status</p>
        <p className="success-value">{order.status}</p>
        <p className="success-note">Your order has been saved successfully.</p>
        <div className="success-actions">
          <Link to="/orders" className="retry-btn" style={{ textDecoration: "none" }}>
            View My Orders
          </Link>
          <Link to="/products" className="back-link">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">{content}</div>
    </>
  );
}
