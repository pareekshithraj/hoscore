import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';
import { pick } from '../utils/pick.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllNotices = async (req: Request, res: Response) => {
  try {
    const notices = await prisma.notice.findMany({ where: { hospitalId: hid(req) }, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] });
    res.json(notices);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notices' }); }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, body, priority, isPinned, expiresAt } = req.body;
    const notice = await prisma.notice.create({
      data: { title, body, priority, isPinned, expiresAt: expiresAt ? new Date(expiresAt) : null, hospitalId: hid(req) },
    });
    await logAudit(req, 'CREATE', 'Notice', notice.id, `Created notice ${notice.title}`);
    res.status(201).json(notice);
  } catch (err) { res.status(500).json({ error: 'Failed to create notice' }); }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.notice.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Notice not found' });
    const safeData = pick(req.body, ['title', 'body', 'priority', 'isPinned']);
    if (req.body.expiresAt !== undefined) (safeData as any).expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    const notice = await prisma.notice.update({ where: { id: req.params.id! }, data: safeData });
    await logAudit(req, 'UPDATE', 'Notice', notice.id, `Updated notice ${notice.title}`);
    res.json(notice);
  } catch (err) { res.status(500).json({ error: 'Failed to update notice' }); }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.notice.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Notice not found' });
    const notice = await prisma.notice.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'Notice', notice.id, `Deleted notice ${notice.title}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete notice' }); }
};

