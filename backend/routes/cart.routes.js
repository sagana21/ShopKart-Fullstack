const router = require("express").Router();
const protect = require("../middlewares/auth.middleware");
const c = require("../controllers/cart.controller");

router.use(protect); // every cart endpoint requires login

router.get("/", c.getCart);
router.post("/:productId", c.addToCart);
router.patch("/:productId", c.updateQuantity);
router.delete("/:productId", c.removeFromCart);

module.exports = router;
