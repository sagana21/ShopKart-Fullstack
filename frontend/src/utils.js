export const rupees = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
