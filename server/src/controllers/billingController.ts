import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

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
