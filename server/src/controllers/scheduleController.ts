import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getDefaultSchedules = async (req: Request, res: Response) => {
  try {
    const defaults = await prisma.defaultSchedule.findMany({ where: { hospitalId: hid(req) }, orderBy: { dayOfWeek: 'asc' } });
    res.json(defaults);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch default schedules' }); }
};

export const upsertDefaultSchedule = async (req: Request, res: Response) => {
  try {
    const { dayOfWeek, isOpen, openTime, closeTime } = req.body;
    const hospitalId = hid(req);
    const dayNum = Number(dayOfWeek);
    const existing = await prisma.defaultSchedule.findFirst({
      where: { hospitalId, dayOfWeek: dayNum }
    });
    
    let schedule;
    if (existing) {
      schedule = await prisma.defaultSchedule.update({
        where: { id: existing.id },
        data: { isOpen, openTime, closeTime }
      });
    } else {
      schedule = await prisma.defaultSchedule.create({
        data: { dayOfWeek: dayNum, isOpen, openTime, closeTime, hospitalId }
      });
    }
    await logAudit(req, existing ? 'UPDATE' : 'CREATE', 'DefaultSchedule', schedule.id, `Saved default schedule for day ${dayNum}`);
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: 'Failed to save default schedule' }); }
};

export const getScheduleOverrides = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }
    const overrides = await prisma.schedule.findMany({ where, orderBy: { date: 'asc' } });
    res.json(overrides);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch schedule overrides' }); }
};

export const upsertScheduleOverride = async (req: Request, res: Response) => {
  try {
    const { date, isOpen, openTime, closeTime, note } = req.body;
    const dateObj = new Date(date); dateObj.setHours(0, 0, 0, 0);
    const hospitalId = hid(req);
    const existing = await prisma.schedule.findFirst({
      where: { hospitalId, date: dateObj }
    });

    let schedule;
    if (existing) {
      schedule = await prisma.schedule.update({
        where: { id: existing.id },
        data: { isOpen, openTime, closeTime, note }
      });
    } else {
      schedule = await prisma.schedule.create({
        data: { date: dateObj, isOpen, openTime, closeTime, note, hospitalId }
      });
    }
    await logAudit(req, existing ? 'UPDATE' : 'CREATE', 'ScheduleOverride', schedule.id, `Saved schedule override for ${dateObj.toISOString().slice(0, 10)}`);
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: 'Failed to save schedule override' }); }
};

export const deleteScheduleOverride = async (req: Request, res: Response) => {
  try {
    const schedule = await prisma.schedule.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'ScheduleOverride', schedule.id, `Deleted schedule override for ${schedule.date.toISOString().slice(0, 10)}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete schedule override' }); }
};
