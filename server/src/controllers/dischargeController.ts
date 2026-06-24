import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const summaries = await prisma.dischargeSummary.findMany({ where: { hospitalId: hid(req) }, orderBy: { createdAt: 'desc' } });
    res.json(summaries);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch discharge summaries' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { patientName, status } = req.body;
    
    // Find active admission for this patient in the active hospital
    const admission = await prisma.admission.findFirst({
      where: {
        patient: {
          name: patientName,
          hospitalId: hid(req)
        },
        dischargeDate: null // Active admission
      }
    });

    const isSigned = status === 'SIGNED' || status === 'FINAL' || !status;
    if (admission && isSigned) {
      // Transition bed to CLEANING
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: 'CLEANING' }
      });
      // Discharge patient
      await prisma.admission.update({
        where: { id: admission.id },
        data: {
          dischargeDate: new Date(),
          status: 'Discharged'
        }
      });
      req.body.admissionId = admission.id;
      req.body.patientId = admission.patientId;
    }

    const summary = await prisma.dischargeSummary.create({ data: { ...req.body, hospitalId: hid(req) } });
    res.status(201).json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create discharge summary' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.dischargeSummary.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Discharge summary not found' });
    
    const summary = await prisma.dischargeSummary.update({ where: { id: req.params.id! }, data: req.body });
    
    const isSigned = req.body.status === 'SIGNED' || req.body.status === 'FINAL';
    if (isSigned && summary.patientName) {
      const admission = await prisma.admission.findFirst({
        where: {
          patient: {
            name: summary.patientName,
            hospitalId: hid(req)
          },
          dischargeDate: null
        }
      });
      if (admission) {
        await prisma.bed.update({
          where: { id: admission.bedId },
          data: { status: 'CLEANING' }
        });
        await prisma.admission.update({
          where: { id: admission.id },
          data: {
            dischargeDate: new Date(),
            status: 'Discharged'
          }
        });
      }
    }
    
    res.json(summary);
  } catch (err) { res.status(500).json({ error: 'Failed to update discharge summary' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.dischargeSummary.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Discharge summary not found' });
    await prisma.dischargeSummary.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete discharge summary' }); }
};
