# HOSCORE — Razorpay Test / Production Setup

Use this guide when submitting your app to Razorpay for live key approval.

## Flow Razorpay Will Review

1. **Hospital registers** at `/register-hospital` → 30-day trial starts (no payment).
2. **Admin logs in** → adds team under **Staff → Portal Access Accounts**.
3. **Admin opens Subscription & Billing** (`/dashboard/subscription`).
4. **Pay now** → Razorpay Standard Checkout opens with amount = `active users × ₹150/year`.
5. **Enable autopay** → Razorpay Subscriptions (yearly, quantity = user count) with hosted auth page.
6. **Webhook** → `POST /api/payments/webhook` confirms payment and activates subscription.

## Required Server Environment Variables

```env
RAZORPAY_KEY_ID=rzp_test_xxxx          # Your test key from Razorpay Dashboard
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx           # From Razorpay Dashboard → Webhooks
CLIENT_URL=https://your-frontend.vercel.app
```

## Webhook URL (configure in Razorpay Dashboard)

```
https://your-api.onrender.com/api/payments/webhook
```

Enable events:
- `payment.captured`
- `order.paid`
- `payment.failed`
- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.cancelled`

## Required Client Environment (Vercel)

```env
VITE_API_URL=https://your-api.onrender.com/api
```

## Test Checklist for Razorpay Review

- [ ] Register a test hospital
- [ ] Add 2+ staff members
- [ ] Open Subscription & Billing — verify amount = users × ₹150
- [ ] Complete test payment with Razorpay test card `4111 1111 1111 1111`
- [ ] Verify subscription status shows **Active**
- [ ] Enable autopay — complete Razorpay subscription auth
- [ ] Confirm webhook received (check Render logs)
- [ ] Payment history shows PAID record with correct user count

## Test Cards (Razorpay Test Mode)

| Card | Result |
|------|--------|
| 4111 1111 1111 1111 | Success |
| Any future expiry, random CVV | |

## Architecture

- **One-time pay**: Razorpay Orders API — billed seats stored on `Subscription.billedSeats`
- **Autopay**: Razorpay Subscriptions API — yearly plan, `quantity` = team size
- **Seat enforcement**: Staff invites blocked when trial expired or paid seats exhausted
