// Razorpay Service — real Standard Web Checkout integration.
// Falls back to a clearly-labelled mock ONLY when credentials are absent (local dev).
import crypto from 'crypto';
import Razorpay from 'razorpay';

const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export const isRazorpayLive = Boolean(RAZORPAY_KEY && RAZORPAY_SECRET);

let client: Razorpay | null = null;
function getClient(): Razorpay {
  if (!client) {
    if (!RAZORPAY_KEY || !RAZORPAY_SECRET) {
      throw new Error('Razorpay credentials are not configured');
    }
    client = new Razorpay({ key_id: RAZORPAY_KEY, key_secret: RAZORPAY_SECRET });
  }
  return client;
}

interface OrderOptions {
  amount: number; // in paise (₹150 = 15000 paise)
  currency?: string;
  hospitalId: string;
  plan: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

export async function createOrder(options: OrderOptions): Promise<RazorpayOrder> {
  const receipt = `hsc_${options.hospitalId.slice(0, 18)}_${Date.now()}`.slice(0, 40);

  if (isRazorpayLive) {
    const order = await getClient().orders.create({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt,
      notes: { hospitalId: options.hospitalId, plan: options.plan },
    });
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      receipt: String(order.receipt ?? receipt),
    };
  }

  // Mock order (dev only — no credentials present)
  const mockOrderId = `order_mock_${Date.now()}`;
  console.log(`💳 [MOCK RAZORPAY] Order ${mockOrderId} | ₹${options.amount / 100} | Plan: ${options.plan}`);
  return {
    id: mockOrderId,
    amount: options.amount,
    currency: options.currency || 'INR',
    status: 'created',
    receipt,
  };
}

/**
 * Verifies the checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret).
 * Returns false on any mismatch. In mock mode (no secret) it only accepts the explicit
 * mock order marker, so a real-looking order id can never be force-verified.
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_SECRET) {
    return orderId.startsWith('order_mock_');
  }
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verifies a Razorpay webhook payload using the webhook secret.
 * `rawBody` MUST be the exact bytes received (use express.raw on the webhook route).
 */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Plans configuration
export const PLANS = {
  STARTER: { name: 'Starter', pricePerUser: 150, maxUsers: 50, features: ['Up to 50 users', 'Basic analytics', 'Email support', 'Standard storage'] },
  PROFESSIONAL: { name: 'Professional', pricePerUser: 300, maxUsers: 200, features: ['Up to 200 users', 'Advanced analytics', 'Priority support', '50GB storage', 'API access'] },
  ENTERPRISE: { name: 'Enterprise', pricePerUser: 500, maxUsers: 9999, features: ['Unlimited users', 'Custom analytics', '24/7 support', 'Unlimited storage', 'Full API access', 'White-labeling'] },
};

export function getRazorpayKeyId() {
  return RAZORPAY_KEY || 'rzp_test_mock_key';
}
