import { Link, useNavigate } from "react-router-dom";
import { logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { totalItems, clearCart } = useCart(); // count comes from shared state, not hardcoded

  const handleLogout = async () => {
    try {
      await logoutCustomer(); // backend clears the HttpOnly cookie
    } catch (err) {
      // even if the API call fails, still send the user to login
      console.error("Logout failed", err);
    } finally {
      clearCart();
      navigate("/login");
    }
  };

  return (
    <nav style={styles.nav}>
      <Link to="/home" style={styles.brand}>
        ShopKart
      </Link>
      <div style={styles.links}>
        <Link to="/home" style={styles.link}>
          Home
        </Link>
        <Link to="/products" style={styles.link}>
          Products
        </Link>
        <Link to="/wishlist" style={styles.link}>
          Wishlist
        </Link>
        <Link to="/orders" style={styles.link}>
          My Orders
        </Link>
        <Link to="/cart" style={styles.link}>
          Cart ({totalItems})
        </Link>
        <button style={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "#4f46e5",
    color: "#fff",
  },
  brand: {
    fontWeight: "bold",
    fontSize: "1.2rem",
    color: "#fff",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: 500,
  },
  button: {
    background: "#fff",
    color: "#4f46e5",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
