import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProductById } from "../services/api";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | error | notfound | success

  useEffect(() => {
    setStatus("loading");
    getProductById(id)
      .then(({ data }) => {
        setProduct(data.product);
        setStatus("success");
      })
      .catch((err) => {
        const code = err.response?.status;
        setStatus(code === 404 || code === 400 ? "notfound" : "error");
      });
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="product-details-page">
        <Link to="/products" className="back-link">
          ← Back to products
        </Link>

        {status === "loading" && <p className="state-message">Loading product...</p>}
        {status === "notfound" && <p className="state-message">Product not found.</p>}
        {status === "error" && (
          <p className="state-message error">Couldn't load this product.</p>
        )}
        {status === "success" && product && (
          <div className="product-details-card">
            <img src={product.image} alt={product.name} />
            <div className="product-details-info">
              <h1>{product.name}</h1>
              <p className="product-card-category">{product.category}</p>
              <p className="product-details-price">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </p>
              <p className="product-details-desc">{product.description}</p>
              <p className={`product-card-stock ${product.stock > 0 ? "" : "out"}`}>
                {product.stock > 0 ? `${product.stock} units left` : "Out of stock"}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
