import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

async function generateSixDigitId() {
  let uniqueId = '';
  let isUnique = false;
  while (!isUnique) {
    uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.patient.findUnique({ where: { sixDigitId: uniqueId } });
    if (!existing) isUnique = true;
  }
  return uniqueId;
}

// Helper to check if doctor has an active/past appointment or admission with the patient at their hospital
async function checkDoctorAccess(patientId: string, hospitalId: string | undefined): Promise<boolean> {
  if (!hospitalId) return false;

  // Check appointments
  const appt = await prisma.appointment.findFirst({
    where: { patientId, hospitalId }
  });
  if (appt) return true;

  // Check admissions
  const adm = await prisma.admission.findFirst({
    where: { patientId, bed: { room: { hospitalId } } }
  });
  if (adm) return true;

  return false;
}

export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { admissions: { some: { bed: { room: { hospitalId: hid(req) } } } } },
      include: { admissions: true },
    });
    // Also include patients with appointments at this hospital
    const apptPatients = await prisma.patient.findMany({
      where: { appointments: { some: { hospitalId: hid(req) } } },
      include: { admissions: true },
    });
    const merged = [...patients];
    for (const p of apptPatients) {
      if (!merged.find(m => m.id === p.id)) merged.push(p);
    }
    res.json(merged);
  } catch { res.status(500).json({ error: 'Failed to fetch patients' }); }
};

export const createPatient = async (req: Request, res: Response) => {
  const { name, contact, email, dateOfBirth, gender, medicalHistory, isHoscoreUser, manualCareNote } = req.body;
  try {
    const shouldCreateHoscoreId = isHoscoreUser !== false;
    let uniqueId: string | null = null;
    if (shouldCreateHoscoreId) {
      uniqueId = await generateSixDigitId();
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        contact,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        medicalHistory,
        hospitalId: hid(req),
        sixDigitId: uniqueId,
        isHoscoreUser: shouldCreateHoscoreId,
        registrationMode: shouldCreateHoscoreId ? 'HOSCORE' : 'WALK_IN_MANUAL',
        manualCareNote: shouldCreateHoscoreId ? null : manualCareNote || 'Patient does not use phone/app. Continue old manual workflow.',
      }
    });
    await logAudit(req, 'CREATE', 'Patient', patient.id, shouldCreateHoscoreId ? `Created HOSCORE patient ${patient.name}` : `Created non-HOSCORE manual patient ${patient.name}`);
    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const getPatientById = async (req: Request, res: Response) => {
  try {
    const patientId = String(req.params.id);
    const role = (req as any).user?.role;
    const hospitalId = hid(req);

    // Secure boundary for doctors
    if (role === 'DOCTOR') {
      const hasAccess = await checkDoctorAccess(patientId, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        admissions: { include: { bed: { include: { room: true } }, billing: true } },
        prescriptions: { where: { hospitalId }, include: { doctor: true } },
        appointments: { where: { hospitalId }, include: { doctor: true } },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch { res.status(500).json({ error: 'Failed to fetch patient' }); }
};

export const getPatientBySixDigitId = async (req: Request, res: Response) => {
  try {
    const { sixDigitId } = req.params;
    const role = (req as any).user?.role;
    const hospitalId = hid(req);

    const patient = await prisma.patient.findUnique({
      where: { sixDigitId: String(sixDigitId) },
      include: {
        admissions: { include: { bed: { include: { room: true } }, billing: true } },
        prescriptions: { where: { hospitalId }, include: { doctor: true } },
        appointments: { where: { hospitalId }, include: { doctor: true } },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

    // Secure boundary for doctors
    if (role === 'DOCTOR') {
      const hasAccess = await checkDoctorAccess(patient.id, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to search patient profile' });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const role = (req as any).user?.role;
    const hospitalId = hid(req);

    // Secure boundary for doctors
    if (role === 'DOCTOR') {
      const hasAccess = await checkDoctorAccess(patientId, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    }

    const patient = await prisma.patient.update({ where: { id: String(patientId) }, data: req.body });
    await logAudit(req, 'UPDATE', 'Patient', patient.id, `Updated patient ${patient.name}`);
    res.json(patient);
  } catch { res.status(500).json({ error: 'Failed to update patient' }); }
};

export const convertManualPatientToHoscore = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const hospitalId = hid(req);
    const existing = await prisma.patient.findFirst({ where: { id: patientId, hospitalId } });
    if (!existing) return res.status(404).json({ error: 'Patient not found' });
    if (existing.isHoscoreUser && existing.sixDigitId) return res.json(existing);

    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        sixDigitId: await generateSixDigitId(),
        isHoscoreUser: true,
        registrationMode: 'HOSCORE',
        manualCareNote: null,
      },
    });
    await logAudit(req, 'CONVERT', 'Patient', patient.id, `Converted manual patient ${patient.name} to HOSCORE user`);
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert patient' });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.delete({ where: { id: String(req.params.id) } });
    await logAudit(req, 'DELETE', 'Patient', patient.id, `Deleted patient ${patient.name}`);
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};
