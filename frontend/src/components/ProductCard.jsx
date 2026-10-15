import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, initiallySaved = false }) {
  const inStock = product.stock > 0;

  // ----- Wishlist (Lab 04) -----
  const [status, setStatus] = useState(initiallySaved ? "saved" : "idle"); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initiallySaved) setStatus((s) => (s === "idle" ? "saved" : s));
  }, [initiallySaved]);

  const handleWishlist = async () => {
    if (status === "saving" || status === "saved") return; // block duplicate clicks
    setStatus("saving");
    setErrorMsg("");
    try {
      await addToWishlist(product._id);
      setStatus("saved");
    } catch (err) {
      const code = err.response?.status;
      if (code === 409) {
        setStatus("saved");
      } else if (code === 401) {
        setStatus("error");
        setErrorMsg("Please log in to save products.");
      } else {
        setStatus("error");
        setErrorMsg("Unable to save product. Please try again.");
      }
    }
  };

  const wishlistLabel = {
    idle: "♡ Add to Wishlist",
    saving: "⏳ Saving...",
    saved: "♥ Added to Wishlist",
    error: "♡ Add to Wishlist",
  }[status];

  // ----- Cart (Lab 05) -----
  const { addToCart, getQuantity, isPending } = useCart();
  const [cartError, setCartError] = useState("");
  const inCart = getQuantity(product._id);
  const adding = isPending(product._id);
  const maxReached = inStock && inCart >= product.stock;

  const handleAddToCart = async () => {
    if (adding) return; // block duplicate clicks
    setCartError("");
    const result = await addToCart(product._id);
    if (!result.success) setCartError(result.message);
  };

  let cartLabel = "Add to Cart";
  if (!inStock) cartLabel = "Out of stock";
  else if (adding) cartLabel = "Adding...";
  else if (maxReached) cartLabel = `Max in cart (${inCart})`;
  else if (inCart > 0) cartLabel = `Add Another (${inCart} in cart)`;

  return (
    <div className="product-card">
      <div className="product-card-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-card-category">{product.category}</p>
        <p className="product-card-price">
          ₹{Number(product.price).toLocaleString("en-IN")}
        </p>
        <p className={`product-card-stock ${inStock ? "" : "out"}`}>
          {inStock ? `${product.stock} units left` : "Out of stock"}
        </p>
        <Link to={`/products/${product._id}`} className="view-details-btn">
          View Details
        </Link>
        <button
          className="cart-btn"
          onClick={handleAddToCart}
          disabled={!inStock || adding || maxReached}
        >
          {cartLabel}
        </button>
        {cartError && (
          <p className="wishlist-error" role="alert">
            {cartError}
          </p>
        )}
        <button
          className={`wishlist-btn ${status === "saved" ? "saved" : ""}`}
          onClick={handleWishlist}
          disabled={status === "saving" || status === "saved"}
        >
          {wishlistLabel}
        </button>
        {status === "error" && (
          <p className="wishlist-error" role="alert">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
}
