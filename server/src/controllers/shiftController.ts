import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { pick } from '../utils/pick.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { date, department } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (date) { const d = new Date(date as string); d.setHours(0,0,0,0); const n = new Date(d); n.setDate(n.getDate()+1); where.date = { gte: d, lt: n }; }
    if (department) where.department = department;
    const shifts = await prisma.shiftSchedule.findMany({ where, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] });
    res.json(shifts);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch shifts' }); }
};

export const createShift = async (req: Request, res: Response) => {
  try {
    const safeData = pick(req.body, ['staffId', 'staffName', 'role', 'department', 'startTime', 'endTime', 'notes', 'status']);
    const shift = await prisma.shiftSchedule.create({ data: { ...safeData, date: new Date(req.body.date), hospitalId: hid(req) } });
    res.status(201).json(shift);
  } catch (err) { res.status(500).json({ error: 'Failed to create shift' }); }
};

export const updateShift = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.shiftSchedule.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Shift schedule not found' });
    const safeData = pick(req.body, ['staffId', 'staffName', 'role', 'department', 'startTime', 'endTime', 'notes', 'status']);
    if (req.body.date) (safeData as any).date = new Date(req.body.date);
    const shift = await prisma.shiftSchedule.update({ where: { id: req.params.id! }, data: safeData });
    res.json(shift);
  } catch (err) { res.status(500).json({ error: 'Failed to update shift' }); }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.shiftSchedule.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Shift schedule not found' });
    await prisma.shiftSchedule.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete shift' }); }
};

