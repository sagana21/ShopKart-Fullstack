import { Link } from "react-router-dom";

export default function WishlistCard({ product, onRemove, removing }) {
  const inStock = product.stock > 0;

  return (
    <div className="product-card">
      <div className="product-card-image">
        <span className="heart-badge">♥</span>
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
          className="remove-btn"
          onClick={() => onRemove(product._id)}
          disabled={removing}
        >
          {removing ? "Removing..." : "Remove ♥"}
        </button>
      </div>
    </div>
  );
}
