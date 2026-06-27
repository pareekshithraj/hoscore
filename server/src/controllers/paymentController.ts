import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  PLANS,
  getRazorpayKeyId,
  createAutopaySubscription,
  cancelRazorpaySubscription,
  isRazorpayLive,
} from '../services/razorpay.js';
import {
  getBillingSnapshot,
  countActiveUsers,
  activatePaidSubscription,
  getLatestSubscription,
} from '../services/subscriptionService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
const hid = (req: Request) => (req as AuthRequest).user?.hospitalId;

function normalizeAmountPaise(amount: unknown) {
  const parsed = typeof amount === 'string' ? Number(amount) : amount;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new Error('Amount must be a valid number');
  }
  const paise = Math.round(parsed);
  if (paise < 100) {
    throw new Error('Amount must be at least 100 paise');
  }
  return paise;
}

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const amount = normalizeAmountPaise(req.body?.amount ?? req.query?.amount);
    const order = await createOrder({
      amount,
      hospitalId: 'public-demo',
      plan: 'STARTER',
      userCount: 1,
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getRazorpayKeyId(),
      mockMode: !isRazorpayLive,
      description: `Demo checkout for ₹${(amount / 100).toLocaleString('en-IN')}`,
    });
  } catch (err) {
    console.error('Create Razorpay order error:', err);
    const message = err instanceof Error ? err.message : 'Failed to create Razorpay order';
    res.status(400).json({ error: message });
  }
};

export const createDemoPaymentOrder = async (req: Request, res: Response) => {
  return createRazorpayOrder(req, res);
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature, amount } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'orderId, paymentId and signature are required' });
    }

    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const amountPaise = normalizeAmountPaise(amount ?? 100);
    res.json({
      success: true,
      message: 'Payment verified successfully',
      amount: amountPaise,
      orderId,
      paymentId,
      mockMode: !isRazorpayLive,
    });
  } catch (err) {
    console.error('Verify Razorpay payment error:', err);
    const message = err instanceof Error ? err.message : 'Payment verification failed';
    res.status(400).json({ error: message });
  }
};

export const verifyDemoPaymentOrder = async (req: Request, res: Response) => {
  return verifyRazorpayPayment(req, res);
};

export const getPlans = async (_req: Request, res: Response) => {
  res.json({ plans: PLANS, razorpayKeyId: getRazorpayKeyId(), razorpayLive: isRazorpayLive });
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const snapshot = await getBillingSnapshot(hospitalId);
    if (!snapshot) return res.status(404).json({ error: 'Subscription not found' });

    const payments = await prisma.payment.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      ...snapshot,
      payments,
      razorpayKeyId: getRazorpayKeyId(),
      razorpayLive: isRazorpayLive,
    });
  } catch (err) {
    console.error('Subscription status error:', err);
    res.status(500).json({ error: 'Failed to load subscription status' });
  }
};

export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { plan } = req.body;
    const planKey = (plan || 'STARTER') as keyof typeof PLANS;
    const planConfig = PLANS[planKey];
    if (!planConfig) return res.status(400).json({ error: 'Invalid plan' });

    const activeUsers = await countActiveUsers(hospitalId);
    if (activeUsers < 1) {
      return res.status(400).json({
        error: 'Add at least one team member before subscribing. Go to Staff → Portal Access Accounts.',
      });
    }

    const sub = await getLatestSubscription(hospitalId);
    const seatsDue =
      sub?.status === 'ACTIVE' && sub.endDate > new Date()
        ? Math.max(1, activeUsers - sub.billedSeats)
        : activeUsers;

    if (sub?.status === 'ACTIVE' && sub.endDate > new Date() && seatsDue <= 0) {
      return res.status(400).json({ error: 'All current team members are already covered by your subscription.' });
    }

    const userCount = Math.max(1, Math.min(seatsDue, planConfig.maxUsers));
    const amountPaise = planConfig.pricePerUser * userCount * 100;

    const order = await createOrder({
      amount: amountPaise,
      hospitalId,
      plan: planKey,
      userCount,
    });

    await prisma.payment.create({
      data: {
        hospitalId,
        orderId: order.id,
        amount: amountPaise / 100,
        currency: 'INR',
        plan: planKey,
        userCount,
        paymentType: sub?.status === 'ACTIVE' ? 'RENEWAL' : 'ONE_TIME',
        status: 'CREATED',
      },
    });

    res.json({
      order,
      keyId: getRazorpayKeyId(),
      userCount,
      amountInr: amountPaise / 100,
      plan: planKey,
    });
  } catch (err) {
    console.error('Payment order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

export const verifyPaymentOrder = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'orderId, paymentId and signature are required' });
    }

    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) return res.status(400).json({ error: 'Payment signature verification failed' });

    const paymentRecord = await prisma.payment.findFirst({ where: { orderId, hospitalId } });
    if (!paymentRecord) return res.status(404).json({ error: 'Payment order not found' });

    await activatePayment(orderId, paymentId, signature);

    res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

export const startAutopay = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { plan } = req.body;
    const planKey = (plan || 'STARTER') as keyof typeof PLANS;
    if (!PLANS[planKey]) return res.status(400).json({ error: 'Invalid plan' });

    const activeUsers = await countActiveUsers(hospitalId);
    if (activeUsers < 1) {
      return res.status(400).json({ error: 'Add team members before enabling autopay.' });
    }

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    const adminMembership = await prisma.membership.findFirst({
      where: { hospitalId, role: 'ADMIN', status: 'ACTIVE' },
      include: { user: { select: { email: true, name: true } } },
    });

    const checkout = await createAutopaySubscription({
      hospitalId,
      plan: planKey,
      userCount: activeUsers,
      customerEmail: adminMembership?.user.email,
      customerName: adminMembership?.user.name || hospital?.name,
    });

    await prisma.payment.create({
      data: {
        hospitalId,
        orderId: checkout.subscriptionId,
        amount: checkout.amount / 100,
        currency: 'INR',
        plan: planKey,
        userCount: checkout.quantity,
        paymentType: 'SUBSCRIPTION',
        razorpaySubscriptionId: checkout.subscriptionId,
        status: 'CREATED',
      },
    });

    await prisma.subscription.updateMany({
      where: { hospitalId },
      data: {
        razorpaySubscriptionId: checkout.subscriptionId,
        razorpayPlanId: checkout.planId,
        plan: planKey,
      },
    });

    res.json({
      subscriptionId: checkout.subscriptionId,
      shortUrl: checkout.shortUrl,
      keyId: getRazorpayKeyId(),
      userCount: checkout.quantity,
      amountInr: checkout.amount / 100,
      plan: planKey,
      mockMode: !isRazorpayLive,
    });
  } catch (err) {
    console.error('Autopay start error:', err);
    res.status(500).json({ error: 'Failed to start autopay subscription' });
  }
};

export const confirmAutopay = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'subscriptionId is required' });

    const payment = await prisma.payment.findFirst({
      where: { hospitalId, razorpaySubscriptionId: subscriptionId, paymentType: 'SUBSCRIPTION' },
    });
    if (!payment) return res.status(404).json({ error: 'Subscription not found' });

    // Mock mode: activate immediately for Razorpay review demo
    if (!isRazorpayLive || subscriptionId.startsWith('sub_mock_')) {
      await activatePaidSubscription(hospitalId, {
        plan: payment.plan,
        userCount: payment.userCount,
        autopay: true,
        razorpaySubscriptionId: subscriptionId,
      });
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    res.json({ success: true, message: 'Autopay subscription confirmed' });
  } catch (err) {
    console.error('Autopay confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm autopay' });
  }
};

export const cancelAutopay = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const sub = await getLatestSubscription(hospitalId);
    if (!sub?.razorpaySubscriptionId) {
      return res.status(400).json({ error: 'No autopay subscription to cancel' });
    }

    await cancelRazorpaySubscription(sub.razorpaySubscriptionId);
    await prisma.subscription.updateMany({
      where: { hospitalId },
      data: { autopayEnabled: false, razorpaySubscriptionId: null },
    });

    res.json({ success: true, message: 'Autopay cancelled. Your plan remains active until the end date.' });
  } catch (err) {
    console.error('Autopay cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel autopay' });
  }
};

async function activatePayment(orderId: string, paymentId?: string, signature?: string) {
  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment) return;
  if (payment.status === 'PAID') return;

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findFirst({ where: { orderId } });
    if (!fresh || fresh.status === 'PAID') return;

    await tx.payment.update({
      where: { id: fresh.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(paymentId ? { paymentId } : {}),
        ...(signature ? { signature } : {}),
      },
    });

    const sub = await tx.subscription.findFirst({
      where: { hospitalId: fresh.hospitalId },
      orderBy: { createdAt: 'desc' },
    });

    const newBilledSeats =
      fresh.paymentType === 'RENEWAL' && sub
        ? sub.billedSeats + fresh.userCount
        : fresh.userCount;

    const planConfig = PLANS[fresh.plan as keyof typeof PLANS];
    await tx.subscription.updateMany({
      where: { hospitalId: fresh.hospitalId },
      data: {
        plan: fresh.plan,
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        trialEndsAt: null,
        billedSeats: newBilledSeats,
        pricePerUser: planConfig?.pricePerUser ?? 150,
        maxUsers: planConfig?.maxUsers ?? 50,
      },
    });
  });
}

async function activateSubscriptionPayment(subscriptionId: string, paymentId?: string) {
  const payment = await prisma.payment.findFirst({
    where: { razorpaySubscriptionId: subscriptionId, paymentType: 'SUBSCRIPTION' },
  });
  if (!payment) return;

  await prisma.payment.updateMany({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: 'PAID', paidAt: new Date(), ...(paymentId ? { paymentId } : {}) },
  });

  await activatePaidSubscription(payment.hospitalId, {
    plan: payment.plan,
    userCount: payment.userCount,
    autopay: true,
    razorpaySubscriptionId: subscriptionId,
  });
}

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody: Buffer = (req as any).rawBody || (req.body as Buffer);

    if (!signature || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const eventType = event?.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const entity = event?.payload?.payment?.entity;
      const orderId: string | undefined = entity?.order_id;
      const paymentId: string | undefined = entity?.id;
      const sig: string | undefined = entity?.signature;
      if (orderId) {
        if (paymentId) {
          await prisma.payment.updateMany({
            where: { orderId },
            data: { paymentId, ...(sig ? { signature: sig } : {}) },
          });
        }
        await activatePayment(orderId, paymentId, sig);
      }
    } else if (eventType === 'payment.failed') {
      const orderId = event?.payload?.payment?.entity?.order_id;
      if (orderId) {
        await prisma.payment.updateMany({
          where: { orderId, status: { not: 'PAID' } },
          data: { status: 'FAILED' },
        });
      }
    } else if (
      eventType === 'subscription.authenticated' ||
      eventType === 'subscription.activated' ||
      eventType === 'subscription.charged'
    ) {
      const subEntity = event?.payload?.subscription?.entity;
      const subscriptionId: string | undefined = subEntity?.id;
      const paymentEntity = event?.payload?.payment?.entity;
      if (subscriptionId) {
        await activateSubscriptionPayment(subscriptionId, paymentEntity?.id);
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.completed') {
      const subscriptionId = event?.payload?.subscription?.entity?.id;
      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: subscriptionId },
          data: { autopayEnabled: false },
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Payment webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const payments = await prisma.payment.findMany({
      where: { hospitalId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};
