import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function CartItem({ item }) {
  const { updateQuantity, removeItem, isPending } = useCart();
  const { product, quantity } = item;
  const [error, setError] = useState("");

  const pending = isPending(product._id); // only THIS item shows its loading state
  const overStock = quantity > product.stock; // stock dropped after the item was added

  const changeQuantity = async (newQuantity) => {
    if (pending) return;
    setError("");
    const result = await updateQuantity(product._id, newQuantity);
    if (!result.success) setError(result.message);
  };

  const handleRemove = async () => {
    if (pending) return;
    setError("");
    const result = await removeItem(product._id);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="cart-item">
      <img src={product.image} alt={product.name} className="cart-item-image" />

      <div className="cart-item-info">
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <p className="product-card-category">{product.category}</p>
        <p className="cart-item-unit">{rupees(product.price)}</p>

        <div className="qty-controls">
          <button
            onClick={() => changeQuantity(quantity - 1)}
            disabled={pending || quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{pending ? "…" : quantity}</span>
          <button
            onClick={() => changeQuantity(quantity + 1)}
            disabled={pending || quantity >= product.stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {overStock && (
          <p className="wishlist-error">
            Only {product.stock} in stock now. Please reduce the quantity.
          </p>
        )}
        {error && (
          <p className="wishlist-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="cart-item-side">
        <p className="cart-item-total">{rupees(product.price * quantity)}</p>
        <button className="remove-btn cart-remove" onClick={handleRemove} disabled={pending}>
          {pending ? "Please wait..." : "Remove"}
        </button>
      </div>
    </div>
  );
}
