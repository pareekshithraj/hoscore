import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { pick } from '../utils/pick.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { entity, action, limit } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (entity) where.entity = entity;
    if (action) where.action = action;
    const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: Number(limit) || 100 });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch audit logs' }); }
};

export const createLog = async (req: Request, res: Response) => {
  try {
    const safeData = pick(req.body, ['action', 'entity', 'entityId', 'details', 'userId', 'userName', 'userRole']);
    const log = await prisma.auditLog.create({ data: { ...safeData, hospitalId: hid(req) } });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ error: 'Failed to create audit log' }); }
};
