const router = require("express").Router();
const c = require("../controllers/product.controller");

router.post("/", c.createProduct);
router.get("/", c.getProducts);
router.get("/:id", c.getProductById);

module.exports = router;
