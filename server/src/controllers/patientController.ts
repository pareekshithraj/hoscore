import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';
import { pick } from '../utils/pick.js';
import { generateSixDigitId, resolveIdentity, findExistingPatient } from '../utils/patientResolver.js';


const hid = (req: Request) => (req as any).user?.hospitalId;

// Helper to check if doctor has an active/past appointment or admission with the patient at their hospital
async function checkDoctorAccess(patientId: string, hospitalId: string | undefined, doctorEmail: string | undefined): Promise<boolean> {
  if (!hospitalId) return false;

  // Fix 2: Check revocation for all doctor records associated with this email & hospital
  if (doctorEmail) {
    const doctors = await prisma.doctor.findMany({
      where: { email: doctorEmail, hospitalId }
    });
    for (const d of doctors) {
      const grant = await prisma.patientAccessGrant.findUnique({
        where: {
          patientId_doctorId: { patientId, doctorId: d.id }
        }
      });
      if (grant && grant.status === 'REVOKED') {
        return false; // Explicitly revoked!
      }
    }
  }


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

async function checkHospitalAccess(patientId: string, hospitalId: string | undefined): Promise<boolean> {
  if (!hospitalId) return false;
  const isPatientConnected = await prisma.patient.findFirst({
    where: {
      id: patientId,
      OR: [
        { hospitalId },
        { appointments: { some: { hospitalId } } },
        { admissions: { some: { bed: { room: { hospitalId } } } } }
      ]
    }
  });
  return !!isPatientConnected;
}

export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { hospitalId },
          { admissions: { some: { bed: { room: { hospitalId } } } } },
          { appointments: { some: { hospitalId } } }
        ]
      },
      include: { admissions: true },
    });
    res.json(patients);
  } catch { res.status(500).json({ error: 'Failed to fetch patients' }); }
};

export const createPatient = async (req: Request, res: Response) => {
  const { name, contact, email, dateOfBirth, gender, medicalHistory, isHoscoreUser, manualCareNote } = req.body;
  const hospitalId = hid(req);
  // Staff can override a duplicate warning by re-submitting with ?force=true
  const force = req.query.force === 'true' || req.body.force === true;
  try {
    // Guard against creating a second record for someone already in this hospital.
    // Only dedups on a STRONG identifier (phone/email/6-digit id) — never name alone.
    if (!force) {
      const existing = await findExistingPatient(hospitalId, { contact, email });
      if (existing) {
        return res.status(409).json({
          error: 'A patient with this phone or email already exists at your hospital.',
          code: 'DUPLICATE_PATIENT',
          existingPatient: existing,
        });
      }
    }

    // Rural / no-phone patients (or explicit opt-out) stay WALK_IN_MANUAL with no
    // HOSCORE id; reachable patients get a HOSCORE 6-digit id. Same rule as booking.
    const { isHoscore, normalizedContact, normalizedEmail } = resolveIdentity({ contact, email, isHoscoreUser });

    let patient: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const sixDigitId = isHoscore ? await generateSixDigitId() : null;
      try {
        patient = await prisma.patient.create({
          data: {
            name,
            contact: normalizedContact,
            email: normalizedEmail,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender,
            medicalHistory,
            hospitalId,
            sixDigitId,
            isHoscoreUser: isHoscore,
            registrationMode: isHoscore ? 'HOSCORE' : 'WALK_IN_MANUAL',
            manualCareNote: isHoscore ? null : manualCareNote || 'Patient does not use phone/app. Continue manual care workflow.',
          }
        });
        break;
      } catch (err: any) {
        if (err?.code === 'P2002' && isHoscore) continue; // sixDigitId collision — retry
        throw err;
      }
    }
    if (!patient) return res.status(500).json({ error: 'Failed to allocate a patient id' });

    await logAudit(req, 'CREATE', 'Patient', patient.id, isHoscore ? `Created HOSCORE patient ${patient.name}` : `Created non-HOSCORE manual patient ${patient.name}`);
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
      const hasAccess = await checkDoctorAccess(patientId, hospitalId, (req as any).user?.email);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    } else {
      const hasAccess = await checkHospitalAccess(patientId, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied: Patient is not registered or has no active records at your hospital.'
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
    
    // Log the read event
    await logAudit(req, 'READ', 'Patient', patient.id, `Accessed patient chart/medical profile for ${patient.name}`);
    
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
      const hasAccess = await checkDoctorAccess(patient.id, hospitalId, (req as any).user?.email);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    } else {
      const hasAccess = await checkHospitalAccess(patient.id, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied: Patient is not registered or has no active records at your hospital.'
        });
      }
    }

    // Log the read event
    await logAudit(req, 'READ', 'Patient', patient.id, `Accessed patient chart/medical profile for ${patient.name}`);

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
      const hasAccess = await checkDoctorAccess(patientId, hospitalId, (req as any).user?.email);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Security Restriction: You do not have an active or past appointment/admission with this patient at your hospital. Access is restricted.'
        });
      }
    } else {
      const hasAccess = await checkHospitalAccess(patientId, hospitalId);
      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied: Patient is not registered or has no active records at your hospital.'
        });
      }
    }

    const safeData = pick(req.body, [
      'name', 'contact', 'email', 'dateOfBirth', 'gender', 'medicalHistory',
      'bloodGroup', 'address', 'city', 'state', 'country', 'manualCareNote',
      'emergencyContact', 'allergies',
    ]);


    const patient = await prisma.patient.update({ where: { id: String(patientId) }, data: safeData });
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
    const patientId = req.params.id;
    const hospitalId = hid(req);

    const hasAccess = await checkHospitalAccess(patientId, hospitalId);
    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied: Patient is not registered or has no active records at your hospital.'
      });
    }

    const patient = await prisma.patient.delete({ where: { id: String(patientId) } });
    await logAudit(req, 'DELETE', 'Patient', patient.id, `Deleted patient ${patient.name}`);
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete patient' }); }
};
