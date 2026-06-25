import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  PLANS,
  getRazorpayKeyId,
} from '../services/razorpay.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

const PLAN_DURATION_YEARS = 1;

function activatedEndDate(from = new Date()) {
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + PLAN_DURATION_YEARS);
  return end;
}

export const getPlans = async (_req: Request, res: Response) => {
  res.json({ plans: PLANS, razorpayKeyId: getRazorpayKeyId() });
};

export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { plan, userCount } = req.body;
    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) return res.status(400).json({ error: 'Invalid plan' });

    // Server-authoritative amount — never trust a client-sent price.
    const seats = Math.max(1, Math.min(Number(userCount) || 1, planConfig.maxUsers));
    const amountPaise = planConfig.pricePerUser * seats * 100;

    const order = await createOrder({ amount: amountPaise, hospitalId, plan });

    await prisma.payment.create({
      data: {
        hospitalId,
        orderId: order.id,
        amount: amountPaise / 100,
        currency: 'INR',
        plan,
        status: 'CREATED',
      },
    });

    res.json({ order, keyId: getRazorpayKeyId() });
  } catch (err) {
    console.error('Payment order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};

/**
 * Client-side confirmation after Razorpay Checkout closes.
 * This verifies the HMAC signature and activates the subscription, but the
 * authoritative source of truth is the webhook (handlePaymentWebhook) — this
 * endpoint is idempotent and safe to call alongside it.
 */
export const verifyPaymentOrder = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: 'orderId, paymentId and signature are required' });
    }

    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) return res.status(400).json({ error: 'Payment signature verification failed' });

    // The order must belong to this hospital (prevents cross-tenant activation).
    const paymentRecord = await prisma.payment.findFirst({ where: { orderId, hospitalId } });
    if (!paymentRecord) return res.status(404).json({ error: 'Payment order not found' });

    await activatePayment(orderId);

    res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

/**
 * Idempotently mark a payment PAID and (re)activate the hospital subscription.
 * Safe to call multiple times (webhook + client confirm) — only acts once.
 */
async function activatePayment(orderId: string) {
  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment) return;
  if (payment.status === 'PAID') return; // already processed — idempotent no-op

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.payment.findFirst({ where: { orderId } });
    if (!fresh || fresh.status === 'PAID') return;

    await tx.payment.update({
      where: { id: fresh.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    const planConfig = PLANS[fresh.plan as keyof typeof PLANS];
    await tx.subscription.updateMany({
      where: { hospitalId: fresh.hospitalId },
      data: {
        plan: fresh.plan,
        status: 'ACTIVE',
        endDate: activatedEndDate(),
        ...(planConfig ? { pricePerUser: planConfig.pricePerUser, maxUsers: planConfig.maxUsers } : {}),
      },
    });
  });
}

/**
 * Razorpay webhook — the authoritative confirmation channel.
 * Requires express.raw on this route so the signature is verified against exact bytes.
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody: Buffer = (req as any).rawBody || (req.body as Buffer);

    if (!signature || !rawBody || !verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const entity = event?.payload?.payment?.entity;
    const orderId: string | undefined = entity?.order_id;
    const paymentId: string | undefined = entity?.id;
    const sig: string | undefined = entity?.signature;

    if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
      if (orderId) {
        if (paymentId) {
          await prisma.payment.updateMany({
            where: { orderId },
            data: { paymentId, ...(sig ? { signature: sig } : {}) },
          });
        }
        await activatePayment(orderId);
      }
    } else if (event?.event === 'payment.failed') {
      if (orderId) {
        await prisma.payment.updateMany({
          where: { orderId, status: { not: 'PAID' } },
          data: { status: 'FAILED' },
        });
      }
    }

    // Always 200 quickly so Razorpay does not retry a handled event.
    res.json({ received: true });
  } catch (err) {
    console.error('Payment webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { hospitalId: hid(req) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};
