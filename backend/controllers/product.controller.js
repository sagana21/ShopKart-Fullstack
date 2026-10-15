const mongoose = require("mongoose");
const Product = require("../models/product.model");

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ success: false, message: err.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const query = {};

    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: safe, $options: "i" };
    }
    if (category) query.category = category;

    const sortOption = {};
    if (sort === "price_asc") sortOption.price = 1;
    if (sort === "price_desc") sortOption.price = -1;

    const products = await Product.find(query)
      .select("name price category image stock")
      .sort(sortOption);

    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid product ID" });

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
