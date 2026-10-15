const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();

// Cookie auth needs: a specific origin (not "*") + credentials: true
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser()); // lets the auth middleware read req.cookies.token

app.use("/customers", require("./routes/customer.routes"));
app.use("/products", require("./routes/product.routes"));
app.use("/wishlist", require("./routes/wishlist.routes")); // Lab 04
app.use("/cart", require("./routes/cart.routes")); // Lab 05
app.use("/orders", require("./routes/order.routes")); // Lab 06

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB error:", err.message));
