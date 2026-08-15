import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';
import { pick } from '../utils/pick.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { hospitalId: hid(req) },
      orderBy: { createdAt: 'desc' },
      include: { patient: true, doctor: true },
    });
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
    const safeData = pick(req.body, ['patientId', 'patientName', 'doctorId', 'doctorName', 'diagnosis', 'instructions', 'status', 'validUntil']);
    const medicinesData = req.body.medicines || req.body.medications || [];
    
    // Default prescription status is ISSUED
    const initialStatus = safeData.status || 'ISSUED';

    // @ts-ignore
    const rx = await prisma.prescription.create({
      data: {
        ...safeData,
        status: initialStatus,
        medicines: medicinesData,
        hospitalId: hid(req),
      },
      include: { patient: true },
    });
    await logAudit(req, 'CREATE', 'Prescription', rx.id, `Prescribed to patient (status: ${initialStatus})`);
    res.status(201).json(rx);
  } catch (err) { res.status(500).json({ error: 'Failed to create prescription' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const existing = await prisma.prescription.findFirst({ where: { id: req.params.id!, hospitalId } });
    if (!existing) return res.status(404).json({ error: 'Prescription not found' });
    
    const newStatus = (req.body.status || '').toUpperCase();
    const currentStatus = (existing.status || 'ISSUED').toUpperCase();

    // Guard: Prevent double-dispensing
    if (currentStatus === 'DISPENSED' && newStatus !== 'DISPENSED') {
      return res.status(400).json({ error: "Prescription is ALREADY DISPENSED and cannot be changed." });
    }

    const rx = await prisma.prescription.update({ where: { id: existing.id }, data: { status: newStatus } });

    const deducted: Array<{ itemName: string; quantity: number; remaining: number }> = [];
    if ((newStatus === 'DISPENSED' || newStatus === 'CURRENT') && currentStatus !== 'DISPENSED' && currentStatus !== 'CURRENT' && existing.medicines) {
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
              const updatedItem = await prisma.inventory.update({
                where: { id: item.id },
                data: { stock: Math.max(0, item.stock - qty) }
              });
              deducted.push({ itemName: item.itemName, quantity: qty, remaining: updatedItem.stock });
            }
          }
        }
      } catch (_e) {
        console.warn('Inventory auto-deduction skipped or failed for prescription:', existing.id);
      }
    }

    await logAudit(
      req,
      'UPDATE',
      'Prescription',
      rx.id,
      deducted.length
        ? `Dispensed ${rx.id}: deducted ${deducted.map((d) => `${d.quantity}× ${d.itemName}`).join(', ')}`
        : `Status set from ${existing.status} to ${rx.status}`,
    );
    res.json({ ...rx, deducted });
  } catch (err) { res.status(500).json({ error: 'Failed to update prescription' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.prescription.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Prescription not found' });
    await prisma.prescription.delete({ where: { id: existing.id } });
    await logAudit(req, 'DELETE', 'Prescription', req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete prescription' }); }
};
