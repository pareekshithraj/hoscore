import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const summaries = await prisma.dischargeSummary.findMany({ where: { hospitalId: hid(req) }, orderBy: { createdAt: 'desc' } });
    res.json(summaries);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch discharge summaries' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const summary = await prisma.dischargeSummary.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(summary);
  } catch (err) { res.status(500).json({ error: 'Failed to create discharge summary' }); }
};

export const update = async (req: Request, res: Response) => {
  try {
    const summary = await prisma.dischargeSummary.update({ where: { id: req.params.id! }, data: req.body });
    res.json(summary);
  } catch (err) { res.status(500).json({ error: 'Failed to update discharge summary' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await prisma.dischargeSummary.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete discharge summary' }); }
};
