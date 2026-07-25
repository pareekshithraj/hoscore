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
    const userId = (req as any).user?.userId;
    const { patientId } = req.body;
    if (patientId && userId) {
      const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { userId: true } });
      if (patient && patient.userId === userId) {
        return res.status(403).json({ error: 'Self-action forbidden: Doctors cannot prescribe medications to themselves.' });
      }
    }
    // @ts-ignore
    const rx = await prisma.prescription.create({ data: { ...req.body, hospitalId: hid(req) }, include: { patient: true } });
    await logAudit(req, 'CREATE', 'Prescription', rx.id, `Prescribed to patient`);
    res.status(201).json(rx);
  } catch (err) { res.status(500).json({ error: 'Failed to create prescription' }); }
};


export const updateStatus = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const existing = await prisma.prescription.findFirst({ where: { id: req.params.id!, hospitalId } });
    if (!existing) return res.status(404).json({ error: 'Prescription not found' });
    
    const newStatus = req.body.status;
    const rx = await prisma.prescription.update({ where: { id: req.params.id! }, data: { status: newStatus } });

    // Auto-deduct matching medicine items from Inventory when status transitions to DISPENSED
    if (newStatus === 'DISPENSED' && existing.status !== 'DISPENSED' && existing.medicines) {
      try {
        let medicineList: Array<{ name?: string; itemName?: string; quantity?: number; count?: number }> = [];
        if (typeof existing.medicines === 'string') {
          medicineList = JSON.parse(existing.medicines);
        } else if (Array.isArray(existing.medicines)) {
          medicineList = existing.medicines as any;
        }

        for (const med of medicineList) {
          const medName = med.name || med.itemName;
          const qty = Number(med.quantity || med.count || 1);
          if (medName) {
            const item = await prisma.inventory.findFirst({
              where: { hospitalId, itemName: { contains: medName, mode: 'insensitive' } }
            });
            if (item && item.stock >= qty) {
              await prisma.inventory.update({
                where: { id: item.id },
                data: { stock: Math.max(0, item.stock - qty) }
              });
            }
          }
        }
      } catch (_e) {
        console.warn('Inventory auto-deduction skipped or failed for prescription:', existing.id);
      }
    }

    await logAudit(req, 'UPDATE', 'Prescription', rx.id, `Status set to ${rx.status}`);
    res.json(rx);
  } catch (err) { res.status(500).json({ error: 'Failed to update prescription' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.prescription.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Prescription not found' });
    await prisma.prescription.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'Prescription', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete prescription' }); }
};
