import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllLabOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (status) where.status = status;
    const orders = await prisma.labOrder.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch lab orders' }); }
};

export const createLabOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { patientId } = req.body;
    if (patientId && userId) {
      const patientObj = await prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true } });
      if (patientObj && patientObj.userId === userId) {
        return res.status(403).json({ error: 'Self-action forbidden: Doctors/Staff cannot order lab tests for themselves.' });
      }
    }
    const order = await prisma.labOrder.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to create lab order' }); }
};


export const updateLabOrder = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.labOrder.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Lab order not found' });

    const data: any = { ...req.body };
    if (data.status === 'COMPLETED') data.completedAt = new Date();
    const order = await prisma.labOrder.update({ where: { id: req.params.id! }, data });
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to update lab order' }); }
};

export const deleteLabOrder = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.labOrder.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Lab order not found' });

    await prisma.labOrder.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete lab order' }); }
};

