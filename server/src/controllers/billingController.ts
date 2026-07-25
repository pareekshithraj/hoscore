import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { generateAndUploadReceipt } from '../services/pdfService.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const getAllBillings = async (req: Request, res: Response) => {
  try {
    const billings = await prisma.billing.findMany({
      where: { admission: { bed: { room: { hospitalId: hid(req) } } } },
      include: { admission: { include: { patient: true } } },
    });
    res.json(billings);
  } catch { res.status(500).json({ error: 'Failed to fetch billings' }); }
};

export const createBilling = async (req: Request, res: Response) => {
  const { admissionId, roomCharges, doctorFees, pharmacyFees, labFees } = req.body;
  const total = (roomCharges || 0) + (doctorFees || 0) + (pharmacyFees || 0) + (labFees || 0);
  try {
    const billing = await prisma.billing.create({ data: { admissionId, roomCharges, doctorFees, pharmacyFees, labFees, totalAmount: total, hospitalId: hid(req) } });
    res.status(201).json(billing);
  } catch { res.status(500).json({ error: 'Failed to create billing' }); }
};

export const updateBillingStatus = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.billing.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Billing record not found' });

    const billing = await prisma.billing.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(billing);
  } catch { res.status(500).json({ error: 'Failed to update billing' }); }
};

export const deleteBilling = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.billing.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Billing record not found' });

    await prisma.billing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};

export const payOffline = async (req: Request, res: Response) => {
  try {
    const { paymentMethod } = req.body;
    const existing = await prisma.billing.findFirst({
      where: { id: req.params.id, hospitalId: hid(req) },
      include: { admission: { include: { patient: true } }, hospital: true }
    });
    if (!existing) return res.status(404).json({ error: 'Billing record not found' });
    if (existing.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    const billing = await prisma.billing.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paymentMethod, paidAt: new Date() }
    });

    const receiptUrl = await generateAndUploadReceipt(billing, existing.hospital, existing.admission.patient.name);
    await prisma.billing.update({ where: { id: billing.id }, data: { receiptUrl } });

    res.json({ ...billing, receiptUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process offline payment' });
  }
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.billing.findFirst({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Billing record not found' });
    if (existing.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    const amountInPaise = Math.round(existing.totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: existing.id,
    });

    await prisma.billing.update({
      where: { id: existing.id },
      data: { razorpayOrderId: order.id }
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create razorpay order' });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const existing = await prisma.billing.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { admission: { include: { patient: true } }, hospital: true }
    });
    
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status === 'PAID') return res.status(400).json({ error: 'Already paid' });

    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const billing = await prisma.billing.update({
      where: { id: existing.id },
      data: { status: 'PAID', paymentMethod: 'ONLINE', razorpayPaymentId: razorpay_payment_id, paidAt: new Date() }
    });

    const receiptUrl = await generateAndUploadReceipt(billing, existing.hospital, existing.admission.patient.name);
    await prisma.billing.update({ where: { id: billing.id }, data: { receiptUrl } });

    res.json({ success: true, receiptUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
