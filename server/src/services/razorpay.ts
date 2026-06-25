// Razorpay Service — Standard Web Checkout + Subscriptions (annual per-user billing).
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
  amount: number; // paise
  currency?: string;
  hospitalId: string;
  plan: string;
  userCount: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

export async function createOrder(options: OrderOptions): Promise<RazorpayOrder> {
  const receipt = `hsc_${options.hospitalId.slice(0, 12)}_${Date.now()}`.slice(0, 40);

  if (isRazorpayLive) {
    const order = await getClient().orders.create({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt,
      notes: {
        hospitalId: options.hospitalId,
        plan: options.plan,
        userCount: String(options.userCount),
      },
    });
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      receipt: String(order.receipt ?? receipt),
    };
  }

  const mockOrderId = `order_mock_${Date.now()}`;
  console.log(
    `💳 [MOCK RAZORPAY] Order ${mockOrderId} | ₹${options.amount / 100} | ${options.userCount} users | Plan: ${options.plan}`,
  );
  return {
    id: mockOrderId,
    amount: options.amount,
    currency: options.currency || 'INR',
    status: 'created',
    receipt,
  };
}

const planIdCache = new Map<string, string>();

export async function ensureRazorpayPlan(planKey: keyof typeof PLANS): Promise<string> {
  const plan = PLANS[planKey];
  const cacheKey = `${planKey}_${plan.pricePerUser}`;
  if (planIdCache.has(cacheKey)) return planIdCache.get(cacheKey)!;

  if (!isRazorpayLive) {
    const mockId = `plan_mock_${planKey.toLowerCase()}`;
    planIdCache.set(cacheKey, mockId);
    return mockId;
  }

  const created = await getClient().plans.create({
    period: 'yearly',
    interval: 1,
    item: {
      name: `HOSCORE ${plan.name}`,
      amount: plan.pricePerUser * 100,
      currency: 'INR',
      description: `₹${plan.pricePerUser}/user/year — ${plan.name} plan`,
    },
    notes: { planKey, product: 'hoscore_saas' },
  });

  planIdCache.set(cacheKey, created.id);
  return created.id;
}

export interface SubscriptionCheckout {
  subscriptionId: string;
  shortUrl: string | null;
  planId: string;
  quantity: number;
  amount: number;
}

export async function createAutopaySubscription(options: {
  hospitalId: string;
  plan: keyof typeof PLANS;
  userCount: number;
  customerEmail?: string;
  customerName?: string;
}): Promise<SubscriptionCheckout> {
  const planConfig = PLANS[options.plan];
  const planId = await ensureRazorpayPlan(options.plan);
  const quantity = Math.max(1, options.userCount);
  const amount = planConfig.pricePerUser * quantity * 100;

  if (!isRazorpayLive) {
    const mockSubId = `sub_mock_${Date.now()}`;
    console.log(
      `💳 [MOCK RAZORPAY] Subscription ${mockSubId} | ${quantity} users | ₹${amount / 100}/yr`,
    );
    return {
      subscriptionId: mockSubId,
      shortUrl: null,
      planId,
      quantity,
      amount,
    };
  }

  const subscription = await getClient().subscriptions.create({
    plan_id: planId,
    quantity,
    total_count: 12,
    customer_notify: 1,
    notes: {
      hospitalId: options.hospitalId,
      plan: options.plan,
      userCount: String(quantity),
    },
    notify_info: options.customerEmail
      ? { notify_email: options.customerEmail }
      : undefined,
  });

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as any).short_url ?? null,
    planId,
    quantity,
    amount,
  };
}

export async function cancelRazorpaySubscription(subscriptionId: string) {
  if (!isRazorpayLive || subscriptionId.startsWith('sub_mock_')) {
    console.log(`💳 [MOCK RAZORPAY] Cancel subscription ${subscriptionId}`);
    return;
  }
  await getClient().subscriptions.cancel(subscriptionId, false);
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_SECRET) {
    return orderId.startsWith('order_mock_');
  }
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  if (!RAZORPAY_WEBHOOK_SECRET || !signature) {
    // Allow mock/dev webhooks when secret not set
    return !isRazorpayLive;
  }
  const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const PLANS = {
  STARTER: {
    name: 'Starter',
    pricePerUser: 150,
    maxUsers: 50,
    features: ['Up to 50 users', 'All hospital modules', 'Patient portal', 'Analytics & reports'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    pricePerUser: 300,
    maxUsers: 200,
    features: ['Up to 200 users', 'Advanced analytics', 'Priority support', 'API access'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    pricePerUser: 500,
    maxUsers: 9999,
    features: ['Unlimited users', 'Custom analytics', '24/7 support', 'White-labeling'],
  },
};

export function getRazorpayKeyId() {
  return RAZORPAY_KEY || 'rzp_test_mock_key';
}

export function getPublicAppUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
}
