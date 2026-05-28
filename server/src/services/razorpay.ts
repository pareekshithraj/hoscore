// Razorpay Service — Mocked for now
// To enable: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env

const RAZORPAY_KEY = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface OrderOptions {
  amount: number; // in paise (₹150 = 15000 paise)
  currency?: string;
  hospitalId: string;
  plan: string;
}

export async function createOrder(options: OrderOptions) {
  if (RAZORPAY_KEY && RAZORPAY_SECRET) {
    // Real Razorpay — uncomment when credentials are available
    // const Razorpay = (await import('razorpay')).default;
    // const rz = new Razorpay({ key_id: RAZORPAY_KEY, key_secret: RAZORPAY_SECRET });
    // const order = await rz.orders.create({
    //   amount: options.amount,
    //   currency: options.currency || 'INR',
    //   receipt: `hoscore_${options.hospitalId}_${Date.now()}`,
    //   notes: { hospitalId: options.hospitalId, plan: options.plan },
    // });
    // return order;
  }

  // Mock order
  const mockOrderId = `order_mock_${Date.now()}`;
  console.log(`💳 [MOCK RAZORPAY] Order created: ${mockOrderId} | ₹${options.amount / 100} | Plan: ${options.plan}`);
  return {
    id: mockOrderId,
    amount: options.amount,
    currency: options.currency || 'INR',
    status: 'created',
    receipt: `hoscore_${options.hospitalId}_${Date.now()}`,
  };
}

export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  if (RAZORPAY_SECRET) {
    // Real verification with HMAC
    // const crypto = await import('crypto');
    // const generated = crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    // return generated === signature;
  }

  // Mock — always verify in test mode
  console.log(`💳 [MOCK RAZORPAY] Payment verified: ${paymentId}`);
  return true;
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
