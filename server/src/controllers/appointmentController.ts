import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { hospitalId: hid(req) },
      include: { patient: true, doctor: true },
      orderBy: { date: 'asc' },
    });
    res.json(appointments);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch appointments' }); }
};

async function getNextAppointmentToken(hospitalId: string, appointmentDate: Date): Promise<number> {
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const highest = await prisma.appointment.findFirst({
    where: {
      hospitalId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { tokenNumber: 'desc' },
    select: { tokenNumber: true },
  });

  return (highest?.tokenNumber || 0) + 1;
}

export const createAppointment = async (req: Request, res: Response) => {
  const { hospitalId, patientName, doctorId, time, date, contact, email, isHoscoreUser, manualCareNote } = req.body;
  const activeHospitalId = hospitalId || hid(req);
  try {
    let patient = await prisma.patient.findFirst({
      where: {
        hospitalId: activeHospitalId,
        OR: [
          { email: email || undefined },
          { name: patientName }
        ]
      }
    });
    if (!patient) {
      const shouldCreateHoscoreId = isHoscoreUser !== false;
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          email: email || undefined,
          contact: contact || undefined,
          hospitalId: activeHospitalId,
          isHoscoreUser: shouldCreateHoscoreId,
          registrationMode: shouldCreateHoscoreId ? 'HOSCORE' : 'WALK_IN_MANUAL',
          manualCareNote: shouldCreateHoscoreId ? null : manualCareNote || 'Patient does not use phone/app. Continue manual care workflow.',
        },
      });
    }
    const apptDate = new Date(date);
    const tokenNumber = await getNextAppointmentToken(activeHospitalId, apptDate);
    const appointment = await prisma.appointment.create({
      data: { hospitalId: activeHospitalId, patientId: patient.id, doctorId: doctorId || null, time, date: apptDate, tokenNumber, status: 'PENDING' },
    });
    res.status(201).json(appointment);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create appointment' }); }
};

export const createPatientAppointment = async (req: AuthRequest, res: Response) => {
  const { hospitalId, doctorId, time, date, patientId } = req.body;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!hospitalId || !date || !time) return res.status(400).json({ error: 'Hospital, date, and time are required' });

  try {
    const hospital = await prisma.hospital.findFirst({ where: { id: hospitalId, isActive: true } });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const primaryPatient = await prisma.patient.findUnique({ where: { userId } });
    if (!primaryPatient || primaryPatient.isHoscoreUser === false) {
      return res.status(403).json({ error: 'A HOSCORE patient profile is required to book appointments online' });
    }

    let targetPatientId = primaryPatient.id;
    if (patientId && patientId !== primaryPatient.id) {
      const dependent = await prisma.patient.findFirst({
        where: { id: patientId, parentId: primaryPatient.id }
      });
      if (!dependent) {
        return res.status(403).json({ error: 'Access denied: Patient is not a registered dependent' });
      }
      targetPatientId = dependent.id;
    }

    const apptDate = new Date(date);
    const tokenNumber = await getNextAppointmentToken(hospitalId, apptDate);
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: targetPatientId,
        doctorId: doctorId || null,
        time,
        date: apptDate,
        tokenNumber,
        status: 'PENDING',
      },
      include: { doctor: { select: { name: true, specialty: true } }, hospital: { select: { name: true } } },
    });

    await logAudit(req, 'CREATE', 'Appointment', appointment.id, `Patient booked appointment at ${hospital.name}`);
    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};


export const checkInAppointment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.id;
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.hospitalId !== hid(req)) {
      return res.status(403).json({ error: 'Access denied: Appointment does not belong to your hospital' });
    }
    
    if (appt.status === 'CONFIRMED') {
      return res.status(400).json({ error: 'Appointment is already checked in' });
    }


    // Update appointment status to CONFIRMED
    const updatedAppt = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' },
    });

    // Automatically create OPDQueue entry
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const lastToken = await prisma.oPDQueue.findFirst({
      where: { hospitalId: appt.hospitalId, date: { gte: today, lt: tomorrow } },
      orderBy: { tokenNumber: 'desc' },
    });
    const queueToken = (lastToken?.tokenNumber || 0) + 1;

    await prisma.oPDQueue.create({
      data: {
        hospitalId: appt.hospitalId,
        patientName: appt.patient.name,
        patientId: appt.patientId,
        doctorName: appt.doctor?.name || 'Any Doctor',
        doctorId: appt.doctorId,
        department: appt.doctor?.specialty || 'General',
        tokenNumber: queueToken,
        status: 'WAITING',
        estimatedWait: 15,
        notes: `Checked-in from appointment (Token: ${appt.tokenNumber})`,
        date: new Date(),
      },
    });

    await logAudit(req, 'UPDATE', 'Appointment', appt.id, `Checked in patient ${appt.patient.name} and added to OPD queue`);
    res.json(updatedAppt);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in appointment' });
  }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};

