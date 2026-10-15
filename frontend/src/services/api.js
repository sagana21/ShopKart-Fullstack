import axios from "axios";

const BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends/receives the HttpOnly auth cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

export const registerCustomer = (data) => api.post("/customers/register", data);

export const loginCustomer = (data) => api.post("/customers/login", data);

export const getCurrentCustomer = () => api.get("/customers/me");

export const logoutCustomer = () => api.post("/customers/logout");

// ----- Products (Lab 03) -----
// params can include { search, category, sort }
export const getProducts = (params = {}) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);

// ----- Wishlist (Lab 04) -----
export const addToWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const getWishlist = () => api.get("/wishlist");
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// ----- Cart (Lab 05) -----
export const getCart = () => api.get("/cart");
export const addToCart = (productId) => api.post(`/cart/${productId}`);
export const updateCartQuantity = (productId, quantity) =>
  api.patch(`/cart/${productId}`, { quantity });
export const removeCartItem = (productId) => api.delete(`/cart/${productId}`);

// ----- Orders + Razorpay (Lab 06) -----
export const createPaymentOrder = (shippingAddress) =>
  api.post("/orders/create-payment-order", { shippingAddress }); // only the address; server owns prices
export const verifyPayment = (payload) => api.post("/orders/verify-payment", payload);
export const reportPaymentFailed = (shopKartOrderId) =>
  api.post("/orders/payment-failed", { shopKartOrderId });
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const advanceOrderStatus = (id) => api.patch(`/orders/${id}/status`); // bonus, dev only

export default api;
