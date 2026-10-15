import { rupees } from "../utils";

// Read-only summary of the cart. The server recalculates the real total at payment time.
export default function OrderSummary({ cartItems, subtotal, children }) {
  return (
    <aside className="order-summary">
      <h2>Order Summary</h2>
      {cartItems.map((item) => (
        <div className="summary-row" key={item.product._id}>
          <span>
            {item.product.name} × {item.quantity}
          </span>
          <span>{rupees(item.product.price * item.quantity)}</span>
        </div>
      ))}
      <div className="summary-row total">
        <span>Total</span>
        <span>{rupees(subtotal)}</span>
      </div>
      {children}
    </aside>
  );
}
