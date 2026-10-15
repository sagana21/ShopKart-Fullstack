import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import { getProducts, getWishlist } from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [status, setStatus] = useState("loading"); // loading | error | success
  const [savedIds, setSavedIds] = useState(new Set());

  // Which products are already in the wishlist (so hearts show correctly). Failure is fine.
  useEffect(() => {
    getWishlist()
      .then(({ data }) => setSavedIds(new Set(data.wishlist.map((p) => p._id))))
      .catch(() => {});
  }, []);

  // Category dropdown options (one unfiltered fetch)
  useEffect(() => {
    getProducts()
      .then(({ data }) => setCategories([...new Set(data.products.map((p) => p.category))]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const { data } = await getProducts({ search, category, sort });
        setProducts(data.products);
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort]);

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>Products</h1>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {status === "loading" && <p className="state-message">Loading products...</p>}
        {status === "error" && (
          <p className="state-message error">Couldn't load products. Please try again.</p>
        )}
        {status === "success" && products.length === 0 && (
          <p className="state-message">No products found.</p>
        )}
        {status === "success" && products.length > 0 && (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} initiallySaved={savedIds.has(p._id)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
