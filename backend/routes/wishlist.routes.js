const router = require("express").Router();
const protect = require("../middlewares/auth.middleware");
const c = require("../controllers/wishlist.controller");

router.use(protect); // every wishlist endpoint requires login

router.get("/", c.getWishlist);
router.post("/:productId", c.addToWishlist);
router.delete("/:productId", c.removeFromWishlist);

module.exports = router;
