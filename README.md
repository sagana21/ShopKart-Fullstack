# ShopKart - Lab 06: Checkout, Razorpay Test Payment & Orders

## Run it
**Backend**: `cd backend` -> `npm install` -> copy `.env.example` to `.env` and fill in `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, **`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`** (Razorpay Dashboard in **Test Mode** -> API Keys) -> `npm run dev`
**Frontend**: `cd frontend` -> `npm install` -> `npm run dev` (http://localhost:5173)

Test card for Razorpay Test Mode: any valid test card from Razorpay's docs (e.g. 4111 1111 1111 1111, any future expiry, any CVV, OTP/success on the mock bank page). Never use Live keys.

## What is new in Lab 06
| File | Change |
|---|---|
| backend/models/order.model.js | Order with item snapshot (name/price/image), shippingAddress, totalAmount, paymentStatus, status, razorpay ids |
| backend/config/razorpay.js | Razorpay client (lazy, reads keys from .env) |
| backend/controllers/order.controller.js | create-payment-order, verify-payment, payment-failed, get orders, get one order, bonus status endpoint |
| backend/routes/order.routes.js | all routes behind `protect` |
| backend/index.js | mounts `/orders` |
| backend/package.json | adds `razorpay` |
| frontend/src/pages/Checkout.jsx | real checkout + Razorpay Standard Checkout flow |
| frontend/src/components/CheckoutForm.jsx, OrderSummary.jsx | shipping form with validation, summary |
| frontend/src/pages/OrderSuccess.jsx | `/order-success/:id` |
| frontend/src/pages/Orders.jsx, OrderDetails.jsx, components/OrderCard.jsx, StatusTracker.jsx | My Orders (loading/empty/error), details, bonus status tracker |
| frontend/src/services/api.js, App.jsx, Navbar.jsx | new API calls, routes, "My Orders" link |

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /orders/create-payment-order | body `{shippingAddress}` only. Validates cart + stock, totals on server, saves PENDING_PAYMENT order, creates Razorpay order (paise) |
| POST | /orders/verify-payment | body `{shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature}`. HMAC-SHA256 check -> PAID/PLACED, clears cart |
| POST | /orders/payment-failed | body `{shopKartOrderId}`. Marks paymentStatus FAILED, cart untouched |
| GET | /orders | current user's orders, newest first (unpaid checkouts hidden) |
| GET | /orders/:id | one order, 404 if it is not yours |
| PATCH | /orders/:id/status | bonus, dev only (disabled when NODE_ENV=production) |

## Design decisions (good viva answers)
- **Server owns money**: body totals/prices are ignored; total = sum(latest price x qty), computed in integer paise.
- **Snapshot**: items copy name/price/image so old orders never change when a Product changes.
- **Signature** = HMAC_SHA256(`razorpayOrderId_from_DB | payment_id`, KEY_SECRET); the order id comes from our DB, not the browser; compared with `timingSafeEqual`.
- **Cart cleared only after verification**; failed/cancelled/invalid payment leaves the cart as is.
- **Idempotent verify**: verifying an already PAID order just returns it.
- **Ownership**: other people's orders return 404 (same as a missing order), so IDs can't be probed.
- **Empty cart on /checkout** shows an empty state instead of the form.
- Stock is validated at checkout but not decremented (not part of the lab spec).

## Postman test plan
1. POST /orders/create-payment-order with empty cart -> 400
2. With items -> 201 `{shopKartOrderId, razorpayOrderId, amount (paise), currency, key}`
3. GET /cart -> still has items
4. POST /orders/verify-payment with a fake signature -> 400, order stays unpaid, cart intact
5. Pay in the UI (test mode) -> PAID/PLACED, GET /cart -> empty
6. GET /orders -> contains the order
7. Quantity above stock -> 400 "Insufficient stock for ..."
8. Add `"totalAmount": 1` to the body -> ignored, real amount used
9. No cookie -> 401
10. GET /orders/:id of another user -> 404
