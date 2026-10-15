import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCurrentCustomer } from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    getCurrentCustomer()
      .then(({ data }) => setCustomer(data))
      .catch(() => navigate("/login"));
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="products-page">
        <h1>Welcome{customer ? `, ${customer.fullName}` : ""} 👋</h1>
        <p className="state-message">Find something you love and save it for later.</p>
        <div style={{ textAlign: "center" }}>
          <Link to="/products" className="view-details-btn" style={{ display: "inline-block", padding: "0.6rem 1.4rem" }}>
            Browse Products
          </Link>
        </div>
      </div>
    </>
  );
}
