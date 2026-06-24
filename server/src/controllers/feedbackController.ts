import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const feedback = await prisma.feedback.findMany({ where: { hospitalId: hid(req) }, orderBy: { createdAt: 'desc' } });
    res.json(feedback);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch feedback' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const fb = await prisma.feedback.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(fb);
  } catch (err) { res.status(500).json({ error: 'Failed to create feedback' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.feedback.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    await prisma.feedback.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete feedback' }); }
};
