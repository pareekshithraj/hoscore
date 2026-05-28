import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (status) where.status = status;
    const claims = await prisma.insuranceClaim.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(claims);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch claims' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const claim = await prisma.insuranceClaim.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(claim);
  } catch (err) { res.status(500).json({ error: 'Failed to create claim' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const data: any = { ...req.body };
    if (['APPROVED', 'REJECTED'].includes(data.status)) data.reviewedAt = new Date();
    const claim = await prisma.insuranceClaim.update({ where: { id: req.params.id! }, data });
    res.json(claim);
  } catch (err) { res.status(500).json({ error: 'Failed to update claim' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await prisma.insuranceClaim.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete claim' }); }
};
