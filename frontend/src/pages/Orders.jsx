import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import OrderCard from "../components/OrderCard";
import { getOrders } from "../services/api";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getOrders();
      setOrders(data.orders);
    } catch (err) {
      if (err.response?.status === 401) return navigate("/login");
      setError("Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  let content;
  if (loading) {
    content = <p className="state-message">Loading your orders...</p>;
  } else if (error) {
    content = (
      <div className="state-message error">
        <h2>{error}</h2>
        <button className="retry-btn" onClick={load}>
          Try Again
        </button>
      </div>
    );
  } else if (orders.length === 0) {
    content = (
      <div className="empty-state">
        <div className="empty-heart">📦</div>
        <h2>You have not placed any orders yet.</h2>
        <button className="retry-btn" onClick={() => navigate("/products")}>
          Start Shopping
        </button>
      </div>
    );
  } else {
    content = (
      <div className="cart-list">
        {orders.map((o) => (
          <OrderCard key={o._id} order={o} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>My Orders</h1>
        {content}
      </div>
    </>
  );
}
