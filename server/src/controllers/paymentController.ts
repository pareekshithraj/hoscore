import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { createOrder, verifyPayment, PLANS, getRazorpayKeyId } from '../services/razorpay.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getPlans = async (req: Request, res: Response) => {
  res.json({ plans: PLANS, razorpayKeyId: getRazorpayKeyId() });
};

export const createPaymentOrder = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const { plan, userCount } = req.body;
    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) return res.status(400).json({ error: 'Invalid plan' });

    const amount = planConfig.pricePerUser * (userCount || 1) * 100; // paise

    const order = await createOrder({ amount, hospitalId, plan });

    // Save payment record
    await prisma.payment.create({
      data: {
        hospitalId,
        orderId: order.id,
        amount: amount / 100,
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

export const verifyPaymentOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    const isValid = verifyPayment(orderId, paymentId, signature || 'mock');

    if (!isValid) return res.status(400).json({ error: 'Payment verification failed' });

    // Update payment record
    const payment = await prisma.payment.updateMany({
      where: { orderId },
      data: { paymentId, signature, status: 'PAID', paidAt: new Date() },
    });

    // Activate/extend subscription
    const paymentRecord = await prisma.payment.findFirst({ where: { orderId } });
    if (paymentRecord) {
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      await prisma.subscription.updateMany({
        where: { hospitalId: paymentRecord.hospitalId },
        data: { plan: paymentRecord.plan, status: 'ACTIVE', endDate },
      });
    }

    res.json({ success: true, message: 'Payment verified and subscription activated' });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
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
