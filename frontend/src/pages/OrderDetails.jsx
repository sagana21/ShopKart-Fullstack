import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatusTracker from "../components/StatusTracker";
import { getOrderById, advanceOrderStatus } from "../services/api";
import { rupees, formatDate } from "../utils";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    getOrderById(id)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || "Unable to load this order."));
  }, [id]);

  // Bonus: dev-only button to move the order forward one status
  const advance = async () => {
    setAdvancing(true);
    try {
      const { data } = await advanceOrderStatus(id);
      setOrder(data.order);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update status.");
    } finally {
      setAdvancing(false);
    }
  };

  let content;
  if (error && !order) {
    content = <p className="state-message error">{error}</p>;
  } else if (!order) {
    content = <p className="state-message">Loading order...</p>;
  } else {
    const a = order.shippingAddress;
    content = (
      <div className="cart-layout">
        <div className="cart-list">
          {order.items.map((item) => (
            <div className="cart-item" key={item.product}>
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <Link to={`/products/${item.product}`} className="cart-item-name">
                  {item.name}
                </Link>
                {/* price paid AT PURCHASE TIME (snapshot) */}
                <p className="cart-item-unit">
                  {rupees(item.price)} × {item.quantity}
                </p>
              </div>
              <div className="cart-item-side">
                <p className="cart-item-total">{rupees(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        <aside className="order-summary">
          <h2>Order #{order._id.slice(-8)}</h2>
          <p className="order-status">{formatDate(order.createdAt)}</p>
          <StatusTracker status={order.status} />
          <div className="summary-row">
            <span>Payment</span>
            <span>{order.paymentStatus}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{rupees(order.totalAmount)}</span>
          </div>
          <h3>Shipping to</h3>
          <p className="order-address">
            {a.fullName}
            <br />
            {a.addressLine1}
            <br />
            {a.city}, {a.state} {a.pincode}
            <br />
            {a.phone}
          </p>
          {order.paymentStatus === "PAID" && order.status !== "DELIVERED" && (
            <button className="retry-btn checkout-btn" onClick={advance} disabled={advancing}>
              {advancing ? "Updating..." : "Advance status (dev)"}
            </button>
          )}
          {error && <p className="wishlist-error">{error}</p>}
        </aside>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>Order Details</h1>
        {content}
        <div style={{ textAlign: "center" }}>
          <Link to="/orders" className="back-link">
            ← Back to My Orders
          </Link>
        </div>
      </div>
    </>
  );
}
