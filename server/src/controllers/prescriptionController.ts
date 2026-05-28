import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const prescriptions = await prisma.prescription.findMany({ where: { hospitalId: hid(req) }, orderBy: { createdAt: 'desc' } });
    res.json(prescriptions);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch prescriptions' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const rx = await prisma.prescription.create({ data: { ...req.body, hospitalId: hid(req) }, include: { patient: true } });
    await logAudit(req, 'CREATE', 'Prescription', rx.id, `Prescribed to patient`);
    res.status(201).json(rx);
  } catch (err) { res.status(500).json({ error: 'Failed to create prescription' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const rx = await prisma.prescription.update({ where: { id: req.params.id! }, data: { status: req.body.status } });
    // @ts-ignore
    await logAudit(req, 'UPDATE', 'Prescription', rx.id, `Status set to ${rx.status}`);
    res.json(rx);
  } catch (err) { res.status(500).json({ error: 'Failed to update prescription' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await prisma.prescription.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'Prescription', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete prescription' }); }
};
