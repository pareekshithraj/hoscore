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
  try {
    let pid = patientId;
    if (!pid && patientName) {
      let patient = await prisma.patient.findFirst({ where: { name: patientName } });
      if (!patient) patient = await prisma.patient.create({ data: { name: patientName } });
      pid = patient.id;
    }
    const admission = await prisma.admission.create({ data: { patientId: pid, bedId, reason } });
    await prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } });
    await prisma.billing.create({ data: { admissionId: admission.id, roomCharges: 500, doctorFees: 200, totalAmount: 700 } });
    res.status(201).json(admission);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create admission' }); }
};

export const dischargePatient = async (req: Request, res: Response) => {
  try {
    const admission = await prisma.admission.update({ where: { id: req.params.id }, data: { dischargeDate: new Date(), status: 'Discharged' } });
    await prisma.bed.update({ where: { id: admission.bedId }, data: { status: 'CLEANING' } });
    res.json(admission);
  } catch { res.status(500).json({ error: 'Failed to discharge patient' }); }
};
