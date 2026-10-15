const router = require("express").Router();
const protect = require("../middlewares/auth.middleware");
const c = require("../controllers/order.controller");

router.use(protect); // every order endpoint requires login

router.post("/create-payment-order", c.createPaymentOrder);
router.post("/verify-payment", c.verifyPayment);
router.post("/payment-failed", c.markPaymentFailed);
router.get("/", c.getMyOrders);
router.get("/:id", c.getOrderById);
router.patch("/:id/status", c.advanceOrderStatus); // bonus (dev only)

module.exports = router;
