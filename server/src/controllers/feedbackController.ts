import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { pick } from '../utils/pick.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const feedback = await prisma.feedback.findMany({ where: { hospitalId: hid(req) }, orderBy: { createdAt: 'desc' } });
    res.json(feedback);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch feedback' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const safeData = pick(req.body, ['patientId', 'patientName', 'doctorName', 'department', 'rating', 'category', 'comment', 'isAnonymous']);
    const fb = await prisma.feedback.create({ data: { ...safeData, hospitalId: hid(req) } });
    res.status(201).json(fb);
  } catch (err) { res.status(500).json({ error: 'Failed to create feedback' }); }
};

export const reply = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.feedback.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    const text = String(req.body.reply || '').trim();
    if (!text) return res.status(400).json({ error: 'Reply is required' });
    const fb = await prisma.feedback.update({
      where: { id: existing.id },
      data: {
        reply: text,
        repliedAt: new Date(),
        repliedBy: req.user?.name || req.body.repliedBy || 'Staff',
      },
    });
    res.json(fb);
  } catch (err) { res.status(500).json({ error: 'Failed to reply' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.feedback.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Feedback not found' });
    await prisma.feedback.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete feedback' }); }
};
