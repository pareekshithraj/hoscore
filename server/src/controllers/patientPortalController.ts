import type { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

async function validatePatientAccess(userId: string, targetPatientId?: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { patientProfile: true } });
  if (!user?.patientProfile) return null;

  if (!targetPatientId || targetPatientId === user.patientProfile.id) {
    return user.patientProfile.id; // accessing own profile
  }

  // Verify targetPatientId is a dependent of the user
  const dependent = await prisma.patient.findFirst({
    where: { id: targetPatientId, parentId: user.patientProfile.id }
  });

  return dependent ? dependent.id : null;
}

export const getDependents = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json([]);
    const dependents = await prisma.patient.findMany({
      where: { parentId: user.patientProfile.id },
      orderBy: { name: 'asc' },
    });
    res.json(dependents);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch dependents' }); }
};

export const createDependent = async (req: AuthRequest, res: Response) => {
  const { name, contact, email, dateOfBirth, gender, bloodGroup } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.status(404).json({ error: 'Patient profile not found' });

    let uniqueId = '';
    let isUnique = false;
    while (!isUnique) {
      uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.patient.findUnique({ where: { sixDigitId: uniqueId } });
      if (!existing) isUnique = true;
    }

    const dependent = await prisma.patient.create({
      data: {
        name,
        contact,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        bloodGroup,
        sixDigitId: uniqueId,
        isHoscoreUser: false,
        registrationMode: 'HOSCORE',
        parentId: user.patientProfile.id,
      },
    });
    res.status(201).json(dependent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create dependent' });
  }
};

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: pid },
      include: { hospital: { select: { name: true } }, doctor: { select: { name: true, specialty: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(appointments);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getMyPrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.json([]);

    const rxs = await prisma.prescription.findMany({
      where: { patientId: pid },
      include: { doctor: { select: { name: true, specialty: true } }, hospital: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(rxs);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getMyRecords = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.json({ vitals: [], labs: [], admissions: [] });

    const [vitals, labs, admissions] = await Promise.all([
      prisma.vitalRecord.findMany({ where: { patientId: pid }, orderBy: { recordedAt: 'desc' }, take: 20 }),
      prisma.labOrder.findMany({ where: { patientId: pid }, orderBy: { orderedAt: 'desc' }, take: 20 }),
      prisma.admission.findMany({ where: { patientId: pid }, include: { bed: { include: { room: true } } }, orderBy: { admissionDate: 'desc' } }),
    ]);
    res.json({ vitals, labs, admissions });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getMyBills = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.json([]);

    const admissions = await prisma.admission.findMany({
      where: { patientId: pid },
      include: { billing: true, bed: { include: { room: { include: { hospital: true } } } } },
    });
    const bills = admissions.filter(a => a.billing).map(a => ({
      ...a.billing, hospitalName: a.bed.room.hospital.name, admissionDate: a.admissionDate, dischargeDate: a.dischargeDate,
    }));
    res.json(bills);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getPatientDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    const patientProfile = await prisma.patient.findUnique({ where: { id: pid } });

    const [upcoming, recentRx] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: pid, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { hospital: { select: { name: true } }, doctor: { select: { name: true } } },
        orderBy: { date: 'asc' }, take: 5,
      }),
      prisma.prescription.findMany({
        where: { patientId: pid },
        include: { doctor: { select: { name: true } }, hospital: { select: { name: true } } },
        orderBy: { date: 'desc' }, take: 5,
      }),
    ]);
    res.json({ upcoming, recentRx, profile: patientProfile });
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const skipAlert = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.status(404).json({ error: 'Patient profile not found' });

    const updated = await prisma.patient.update({
      where: { id: user.patientProfile.id },
      data: {
        nextAppointmentAlertStatus: 'SKIPPED',
        nextAppointmentAlertDate: null,
      },
    });

    res.json({ message: 'Alert skipped successfully', profile: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to skip alert' });
  }
};

export const closeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.status(404).json({ error: 'Patient profile not found' });

    const appointment = await prisma.appointment.findUnique({ where: { id: String(id) } });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Allow parent to close appointment as well
    const hasAccess = appointment.patientId === user.patientProfile.id || 
                      await prisma.patient.findFirst({ where: { id: appointment.patientId, parentId: user.patientProfile.id } });
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied: This appointment does not belong to you' });
    }

    const updated = await prisma.appointment.update({
      where: { id: String(id) },
      data: { status: 'COMPLETED' },
    });

    res.json({ message: 'Appointment closed successfully', appointment: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to close appointment' });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.status(404).json({ error: 'Patient profile not found' });
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const hasAccess = appointment.patientId === user.patientProfile.id || 
                      await prisma.patient.findFirst({ where: { id: appointment.patientId, parentId: user.patientProfile.id } });
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    if (appointment.status === 'COMPLETED') return res.status(400).json({ error: 'Completed appointments cannot be cancelled' });
    const updated = await prisma.appointment.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ error: 'Date and time are required' });
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.status(404).json({ error: 'Patient profile not found' });
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const hasAccess = appointment.patientId === user.patientProfile.id || 
                      await prisma.patient.findFirst({ where: { id: appointment.patientId, parentId: user.patientProfile.id } });
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') return res.status(400).json({ error: 'This appointment cannot be rescheduled' });
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { date: new Date(date), time, status: 'PENDING' },
      include: { hospital: { select: { name: true } }, doctor: { select: { name: true, specialty: true } } },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reschedule appointment' });
  }
};

export const getVaccinations = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    let vaccinations = await prisma.vaccination.findMany({
      where: { patientId: pid },
      orderBy: { createdAt: 'asc' }
    });

    if (vaccinations.length === 0) {
      const presets = [
        { name: 'BCG (Tuberculosis)', scheduledAge: 'At Birth' },
        { name: 'Hepatitis B (Birth Dose)', scheduledAge: 'At Birth' },
        { name: 'OPV 0 (Polio)', scheduledAge: 'At Birth' },
        { name: 'Pentavalent 1 (DPT, HepB, Hib)', scheduledAge: '6 Weeks' },
        { name: 'Rotavirus 1', scheduledAge: '6 Weeks' },
        { name: 'OPV 1', scheduledAge: '6 Weeks' },
        { name: 'Pentavalent 2', scheduledAge: '10 Weeks' },
        { name: 'Rotavirus 2', scheduledAge: '10 Weeks' },
        { name: 'OPV 2', scheduledAge: '10 Weeks' },
        { name: 'Pentavalent 3', scheduledAge: '14 Weeks' },
        { name: 'Rotavirus 3', scheduledAge: '14 Weeks' },
        { name: 'OPV 3', scheduledAge: '14 Weeks' },
        { name: 'Measles & Rubella (MR) 1st Dose', scheduledAge: '9 Months' },
        { name: 'JE 1st Dose (Japanese Encephalitis)', scheduledAge: '9 Months' },
        { name: 'MMR 1st Dose (Measles, Mumps, Rubella)', scheduledAge: '15 Months' },
        { name: 'DPT Booster 1', scheduledAge: '16-24 Months' },
        { name: 'OPV Booster', scheduledAge: '16-24 Months' },
        { name: 'DPT Booster 2', scheduledAge: '5-6 Years' },
        { name: 'Td (Tetanus, Diphtheria)', scheduledAge: '10 Years' },
        { name: 'Td Booster', scheduledAge: '15 Years' }
      ];

      // Insert presets
      await prisma.vaccination.createMany({
        data: presets.map(p => ({
          patientId: pid,
          name: p.name,
          scheduledAge: p.scheduledAge,
          status: 'PENDING'
        }))
      });

      vaccinations = await prisma.vaccination.findMany({
        where: { patientId: pid },
        orderBy: { createdAt: 'asc' }
      });
    }

    res.json(vaccinations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch vaccinations' });
  }
};

export const recordVaccination = async (req: AuthRequest, res: Response) => {
  try {
    const { id, status, givenAt, givenBy, notes } = req.body;
    if (!id) return res.status(400).json({ error: 'Vaccination record ID is required' });

    const vaccine = await prisma.vaccination.findUnique({ where: { id } });
    if (!vaccine) return res.status(404).json({ error: 'Vaccine record not found' });

    const pid = await validatePatientAccess(req.user!.userId, vaccine.patientId);
    if (!pid) return res.status(403).json({ error: 'Access denied' });

    const updated = await prisma.vaccination.update({
      where: { id },
      data: {
        status: status || 'COMPLETED',
        givenAt: givenAt ? new Date(givenAt) : new Date(),
        givenBy: givenBy || 'Self-reported (Patient Portal)',
        notes: notes || null
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update vaccination record' });
  }
};

export const getAccessGrants = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    // Fetch all doctors
    const doctors = await prisma.doctor.findMany({
      include: {
        hospital: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Fetch all access grants for this patient
    const grants = await prisma.patientAccessGrant.findMany({
      where: { patientId: pid }
    });

    const grantMap = new Map(grants.map(g => [g.doctorId, g.status]));

    const result = doctors.map(doc => ({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      hospitalName: doc.hospital?.name || 'General Clinic',
      status: grantMap.get(doc.id) || 'ACTIVE' // Default is ACTIVE
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch access grants' });
  }
};

export const revokeDoctorAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, patientId } = req.body;
    if (!doctorId) return res.status(400).json({ error: 'Doctor ID is required' });

    const pid = await validatePatientAccess(req.user!.userId, patientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    const grant = await prisma.patientAccessGrant.upsert({
      where: {
        patientId_doctorId: { patientId: pid, doctorId }
      },
      update: { status: 'REVOKED' },
      create: { patientId: pid, doctorId, status: 'REVOKED' }
    });

    res.json(grant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to revoke doctor access' });
  }
};

export const restoreDoctorAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, patientId } = req.body;
    if (!doctorId) return res.status(400).json({ error: 'Doctor ID is required' });

    const pid = await validatePatientAccess(req.user!.userId, patientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    const grant = await prisma.patientAccessGrant.upsert({
      where: {
        patientId_doctorId: { patientId: pid, doctorId }
      },
      update: { status: 'ACTIVE' },
      create: { patientId: pid, doctorId, status: 'ACTIVE' }
    });

    res.json(grant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to restore doctor access' });
  }
};

export const getAccessLogs = async (req: AuthRequest, res: Response) => {
  try {
    const targetPatientId = req.query.patientId as string;
    const pid = await validatePatientAccess(req.user!.userId, targetPatientId);
    if (!pid) return res.status(404).json({ error: 'Patient profile not found' });

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: 'Patient',
        entityId: pid,
        action: 'READ'
      },
      include: {
        hospital: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
};
