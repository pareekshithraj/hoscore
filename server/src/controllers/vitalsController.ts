import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getVitals = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (patientId) where.patientId = patientId;
    const vitals = await prisma.vitalRecord.findMany({ where, orderBy: { recordedAt: 'desc' }, take: 50 });
    res.json(vitals);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch vitals' }); }
};

export const recordVitals = async (req: Request, res: Response) => {
  try {
    const vital = await prisma.vitalRecord.create({ data: { ...req.body, hospitalId: hid(req), recordedAt: new Date() } });
    res.status(201).json(vital);
  } catch (err) { res.status(500).json({ error: 'Failed to record vitals' }); }
};

export const deleteVital = async (req: Request, res: Response) => {
  try {
    await prisma.vitalRecord.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete vital' }); }
};
