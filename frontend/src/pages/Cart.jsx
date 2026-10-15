import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, error, totalItems, subtotal, hasStockIssue, refreshCart } = useCart();

  let content;

  if (loading) {
    content = <p className="state-message">Loading your cart...</p>;
  } else if (error) {
    content = (
      <div className="state-message error">
        <h2>Unable to load your cart.</h2>
        <button className="retry-btn" onClick={refreshCart}>
          Try Again
        </button>
      </div>
    );
  } else if (cartItems.length === 0) {
    content = (
      <div className="empty-state">
        <div className="empty-heart">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <button className="retry-btn" onClick={() => navigate("/products")}>
          Browse Products
        </button>
      </div>
    );
  } else {
    content = (
      <div className="cart-layout">
        <div className="cart-list">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </div>

        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{totalItems}</span>
          </div>
          <div className="summary-row total">
            <span>Subtotal</span>
            <span>{rupees(subtotal)}</span>
          </div>
          {hasStockIssue && (
            <p className="wishlist-error">Reduce the quantity of items marked above to continue.</p>
          )}
          <button
            className="retry-btn checkout-btn"
            onClick={() => navigate("/checkout")}
            disabled={hasStockIssue}
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>My Cart</h1>
        {content}
      </div>
    </>
  );
}
