import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";
import { getWishlist, removeFromWishlist } from "../services/api";

export default function Wishlist() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [removingId, setRemovingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const loadWishlist = useCallback(async () => {
    setStatus("loading");
    try {
      const { data } = await getWishlist();
      setItems(data.wishlist);
      setStatus("success");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setStatus("error");
    }
  }, [navigate]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    setActionError("");
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((p) => p._id !== productId)); // no page refresh
    } catch (err) {
      if (err.response?.status === 401) return navigate("/login");
      setActionError("Couldn't remove that product. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  let content;

  if (status === "loading") {
    content = <p className="state-message">Loading your wishlist...</p>;
  } else if (status === "error") {
    content = (
      <div className="state-message error">
        <h2>Something went wrong.</h2>
        <p>We couldn't load your wishlist.</p>
        <button className="retry-btn" onClick={loadWishlist}>
          Try Again
        </button>
      </div>
    );
  } else if (items.length === 0) {
    content = (
      <div className="empty-state">
        <div className="empty-heart">❤️</div>
        <h2>Your wishlist is empty</h2>
        <p>Save products you love and find them here later.</p>
        <button className="retry-btn" onClick={() => navigate("/products")}>
          Browse Products
        </button>
      </div>
    );
  } else {
    content = (
      <>
        {actionError && (
          <p className="wishlist-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="product-grid">
          {items.map((p) => (
            <WishlistCard
              key={p._id}
              product={p}
              onRemove={handleRemove}
              removing={removingId === p._id}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>My Wishlist</h1>
        {status === "success" && items.length > 0 && (
          <p className="wishlist-subtitle">
            {items.length} product{items.length > 1 ? "s" : ""} saved
          </p>
        )}
        {content}
      </div>
    </>
  );
}
