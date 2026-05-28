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
    const order = await prisma.labOrder.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to create lab order' }); }
};

export const updateLabOrder = async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (data.status === 'COMPLETED') data.completedAt = new Date();
    const order = await prisma.labOrder.update({ where: { id: req.params.id! }, data });
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to update lab order' }); }
};

export const deleteLabOrder = async (req: Request, res: Response) => {
  try {
    await prisma.labOrder.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete lab order' }); }
};
