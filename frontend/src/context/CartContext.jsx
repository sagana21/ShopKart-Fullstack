import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as cartApi from "../services/api";

const CartContext = createContext(null);

// ONE shared source of truth for the cart. Navbar, ProductCard, Cart page and
// Order Summary all read from here; nobody fetches the cart on their own.
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]); // [{ product: {...}, quantity }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState([]); // product ids with a request in flight

  // Load the cart from the backend (on app start, after login, and for "Try Again")
  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await cartApi.getCart();
      setCartItems(data.cart);
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]); // not logged in -> just an empty cart, not an error
      } else {
        setError("Unable to load your cart.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Every mutation: call the API -> backend returns the updated cart -> store it.
  // Returns { success, message } so the calling component can show feedback.
  const runMutation = useCallback(async (productId, request, fallbackMessage) => {
    setPendingIds((ids) => [...ids, productId]);
    try {
      const { data } = await request();
      setCartItems(data.cart);
      return { success: true };
    } catch (err) {
      if (err.response?.status === 401) {
        setCartItems([]);
        return { success: false, message: "Please log in to use your cart." };
      }
      return { success: false, message: err.response?.data?.message || fallbackMessage };
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== productId));
    }
  }, []);

  const addToCart = useCallback(
    (productId) =>
      runMutation(productId, () => cartApi.addToCart(productId), "Unable to add to cart. Please try again."),
    [runMutation]
  );

  const updateQuantity = useCallback(
    (productId, quantity) =>
      runMutation(
        productId,
        () => cartApi.updateCartQuantity(productId, quantity),
        "Unable to update quantity. Please try again."
      ),
    [runMutation]
  );

  const removeItem = useCallback(
    (productId) =>
      runMutation(productId, () => cartApi.removeCartItem(productId), "Unable to remove item. Please try again."),
    [runMutation]
  );

  // Used on logout (the server cart stays in MongoDB; this only clears the screen copy)
  const clearCart = useCallback(() => setCartItems([]), []);

  const isPending = useCallback((productId) => pendingIds.includes(productId), [pendingIds]);

  // Derived values: calculated from state, never stored
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const hasStockIssue = useMemo(
    () => cartItems.some((item) => item.quantity > item.product.stock),
    [cartItems]
  );

  const getQuantity = useCallback(
    (productId) => cartItems.find((item) => item.product._id === productId)?.quantity || 0,
    [cartItems]
  );

  const value = {
    cartItems,
    loading,
    error,
    totalItems,
    subtotal,
    hasStockIssue,
    getQuantity,
    isPending,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
