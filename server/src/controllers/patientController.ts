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

/**
 * Builds the `where.OR` used to pull clinical records (vitals, labs) for one patient.
 *
 * Records are keyed by `patientId`, but legacy/manual rows were written with only a
 * free-text `patientName`. Matching on name alone leaks records between two patients
 * who share a name, so name matching is allowed ONLY when both hold:
 *   - the row has no `patientId` at all (nothing better to key on), and
 *   - the name is unambiguous — exactly one patient with that name in this hospital.
 * If the name is shared, we fall back to `patientId`-only and the orphan rows stay
 * hidden rather than being attributed to the wrong chart.
 */
async function clinicalRecordFilter(
  patient: { id: string; name: string | null },
  hospitalId: string | undefined
): Promise<any[]> {
  const byId = [{ patientId: patient.id }];
  if (!patient.name) return byId;

  const sameName = await prisma.patient.count({
    where: {
      name: { equals: patient.name, mode: 'insensitive' },
      ...(hospitalId
        ? {
            OR: [
              { hospitalId },
              { appointments: { some: { hospitalId } } },
              { admissions: { some: { bed: { room: { hospitalId } } } } },
            ],
          }
        : {}),
    },
  });

  // More than one patient answers to this name — name matching is unsafe here.
  if (sameName > 1) return byId;

  return [
    ...byId,
    { AND: [{ patientId: null }, { patientName: { equals: patient.name, mode: 'insensitive' as const } }] },
  ];
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
        admissions: {
          include: { bed: { include: { room: true } }, billing: true },
          orderBy: { admissionDate: 'desc' },
        },
        prescriptions: {
          where: { hospitalId },
          include: { doctor: true },
          orderBy: { date: 'desc' },
        },
        appointments: {
          where: { hospitalId },
          include: { doctor: true },
          orderBy: { date: 'desc' },
        },
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Enrich chart with vitals + labs using safe deduplication by patientId
    const clinicalOR = await clinicalRecordFilter(patient, hospitalId);
    const [vitals, labOrders] = await Promise.all([
      prisma.vitalRecord.findMany({
        where: { hospitalId, OR: clinicalOR },
        orderBy: { recordedAt: 'desc' },
        take: 40,
      }),
      prisma.labOrder.findMany({
        where: { hospitalId, OR: clinicalOR },
        orderBy: { orderedAt: 'desc' },
        take: 40,
      }),
    ]);
    
    // Log the read event
    await logAudit(req, 'READ', 'Patient', patient.id, `Accessed patient chart/medical profile for ${patient.name}`);
    
    res.json({ ...patient, vitals, labOrders });
  } catch { res.status(500).json({ error: 'Failed to fetch patient' }); }
};

export const getPatientBySixDigitId = async (req: Request, res: Response) => {
  try {
    const { sixDigitId } = req.params;
    const hospitalId = hid(req);

    const patient = await prisma.patient.findUnique({
      where: { sixDigitId: String(sixDigitId) },
      include: {
        admissions: { include: { bed: { include: { room: true } }, billing: true }, orderBy: { admissionDate: 'desc' } },
        prescriptions: { include: { doctor: true }, orderBy: { date: 'desc' } },
        appointments: { include: { doctor: true }, orderBy: { date: 'desc' } },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient profile not found for this Hoscore ID' });

    // Fetch vitals, lab orders, and vaccinations for complete clinical picture
    const [vitals, labOrders, vaccinations] = await Promise.all([
      prisma.vitalRecord.findMany({
        where: {
          OR: [
            { patientId: patient.id },
            ...(patient.name ? [{ patientName: { equals: patient.name, mode: 'insensitive' as const } }] : []),
          ],
        },
        orderBy: { recordedAt: 'desc' },
        take: 50,
      }),
      prisma.labOrder.findMany({
        where: {
          OR: [
            { patientId: patient.id },
            ...(patient.name ? [{ patientName: { equals: patient.name, mode: 'insensitive' as const } }] : []),
          ],
        },
        orderBy: { orderedAt: 'desc' },
        take: 50,
      }),
      prisma.vaccination.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Log the read event for audit trail
    await logAudit(req, 'READ', 'Patient', patient.id, `Scanned/searched patient profile #${patient.sixDigitId} (${patient.name})`);

    res.json({ ...patient, vitals, labOrders, vaccinations });
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

export const completeVaccination = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const vaccine = await prisma.vaccination.findUnique({ where: { id: req.params.id } });
    if (!vaccine) return res.status(404).json({ error: 'Vaccination record not found' });
    const allowed = await checkHospitalAccess(vaccine.patientId, hospitalId);
    if (!allowed) return res.status(403).json({ error: 'Patient is not on your hospital roster' });

    const staffName = (req as any).user?.name || 'Hospital staff';
    const updated = await prisma.vaccination.update({
      where: { id: vaccine.id },
      data: {
        status: 'COMPLETED',
        givenAt: req.body.givenAt ? new Date(req.body.givenAt) : new Date(),
        givenBy: req.body.givenBy || staffName,
        notes: req.body.notes || null,
      },
    });
    await logAudit(req, 'UPDATE', 'Vaccination', updated.id, `Recorded ${updated.name} for patient`);
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to record vaccination' });
  }
};
