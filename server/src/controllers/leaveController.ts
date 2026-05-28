import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (status) where.status = status;
    const leaves = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(leaves);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch leave requests' }); }
};

export const createLeave = async (req: Request, res: Response) => {
  try {
    const { staffId, doctorId, staffName, role, startDate, endDate, type, reason } = req.body;
    const leave = await prisma.leaveRequest.create({
      data: { staffId, doctorId, staffName, role, startDate: new Date(startDate), endDate: new Date(endDate), type, reason, hospitalId: hid(req) },
    });
    await logAudit(req, 'CREATE', 'LeaveRequest', leave.id, `Created leave request for ${leave.staffName}`);
    res.status(201).json(leave);
  } catch (err) { res.status(500).json({ error: 'Failed to create leave request' }); }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const leave = await prisma.leaveRequest.update({ where: { id: req.params.id! }, data: { status: req.body.status, reviewedBy: req.body.reviewedBy } });
    await logAudit(req, 'UPDATE', 'LeaveRequest', leave.id, `Updated leave request for ${leave.staffName} to ${leave.status}`);
    res.json(leave);
  } catch (err) { res.status(500).json({ error: 'Failed to update leave status' }); }
};

export const deleteLeave = async (req: Request, res: Response) => {
  try {
    const leave = await prisma.leaveRequest.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'LeaveRequest', leave.id, `Deleted leave request for ${leave.staffName}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete leave request' }); }
};
