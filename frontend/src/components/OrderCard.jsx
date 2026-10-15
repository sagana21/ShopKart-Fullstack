import { Link } from "react-router-dom";
import StatusTracker from "./StatusTracker";
import { rupees, formatDate } from "../utils";

export default function OrderCard({ order }) {
  return (
    <div className="order-card">
      <div className="order-card-head">
        <strong>Order #{order._id.slice(-8)}</strong>
        <span>{formatDate(order.createdAt)}</span>
      </div>
      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>
      <StatusTracker status={order.status} />
      <div className="order-card-foot">
        <div>
          <p className="order-total">Total: {rupees(order.totalAmount)}</p>
          <p className="order-status">Status: {order.status}</p>
        </div>
        <Link to={`/orders/${order._id}`} className="view-details-btn" style={{ textDecoration: "none" }}>
          View Details
        </Link>
      </div>
    </div>
  );
}
