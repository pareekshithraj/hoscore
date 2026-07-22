import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllAdmissions = async (req: Request, res: Response) => {
  try {
    const admissions = await prisma.admission.findMany({
      where: { bed: { room: { hospitalId: hid(req) } } },
      include: { patient: true, bed: { include: { room: true } }, billing: true },
    });
    res.json(admissions);
  } catch { res.status(500).json({ error: 'Failed to fetch admissions' }); }
};

export const createAdmission = async (req: Request, res: Response) => {
  const { patientId, patientName, bedId, reason } = req.body;
  const hospitalId = hid(req);
  try {
    const targetBed = await prisma.bed.findFirst({
      where: { id: bedId, room: { hospitalId } },
      include: { room: true }
    });
    if (!targetBed) {
      return res.status(404).json({ error: 'Selected bed not found at your hospital.' });
    }
    if (targetBed.status === 'OCCUPIED' || targetBed.status === 'OCCUPIED_ICU' || targetBed.status === 'MAINTENANCE') {
      return res.status(400).json({ error: `Selected bed (${targetBed.bedNumber}) is currently ${targetBed.status.toLowerCase()}. Please select an available bed.` });
    }

    let pid = patientId;
    if (!pid && patientName) {
      let patient = await prisma.patient.findFirst({ where: { name: patientName, hospitalId } });
      if (!patient) patient = await prisma.patient.create({ data: { name: patientName, hospitalId } });
      pid = patient.id;
    }

    const roomRate = targetBed.room?.basePrice || 500;
    const isIcu = targetBed.room?.type?.toUpperCase().includes('ICU') || targetBed.room?.name?.toUpperCase().includes('ICU');
    const bedStatus = isIcu ? 'OCCUPIED_ICU' : 'OCCUPIED';

    const admission = await prisma.$transaction(async (tx) => {
      const newAdm = await tx.admission.create({ data: { patientId: pid, bedId, reason } });
      await tx.bed.update({ where: { id: bedId }, data: { status: bedStatus } });
      await tx.billing.create({
        data: {
          admissionId: newAdm.id,
          roomCharges: roomRate,
          doctorFees: 300,
          totalAmount: roomRate + 300,
          hospitalId
        }
      });
      return newAdm;
    });

    res.status(201).json(admission);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create admission' }); }
};

export const dischargePatient = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.admission.findFirst({ where: { id: req.params.id, bed: { room: { hospitalId: hid(req) } } } });
    if (!existing) return res.status(404).json({ error: 'Admission not found' });
    const admission = await prisma.admission.update({ where: { id: req.params.id }, data: { dischargeDate: new Date(), status: 'Discharged' } });
    await prisma.bed.update({ where: { id: admission.bedId }, data: { status: 'CLEANING' } });
    res.json(admission);
  } catch { res.status(500).json({ error: 'Failed to discharge patient' }); }
};
