import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../utils/auditLogger.js';
import { findOrCreatePatient } from '../utils/patientResolver.js';
import { parseDateSafe } from '../utils/dateUtils.js';
import { normalizeTimeString } from './hospitalController.js';

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
  const safeDate = parseDateSafe(appointmentDate) || new Date();
  const startOfDay = new Date(safeDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(safeDate);
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
  const { hospitalId, patientName, doctorId, time, date, contact, email, isHoscoreUser, manualCareNote, sixDigitId, patientId } = req.body;
  const activeHospitalId = hospitalId || hid(req);
  try {
    let targetPatientId = patientId;
    let targetName = patientName;

    if (!targetPatientId && sixDigitId) {
      const found = await prisma.patient.findUnique({ where: { sixDigitId: String(sixDigitId) } });
      if (found) {
        targetPatientId = found.id;
        targetName = found.name;
      }
    }

    if (!targetPatientId) {
      const { patient } = await findOrCreatePatient(activeHospitalId, {
        name: patientName || 'Walk-in Patient',
        contact,
        email,
        isHoscoreUser,
        manualCareNote,
      });
      targetPatientId = patient.id;
      targetName = patient.name;
    }

    const apptDate = parseDateSafe(date) || new Date();
    const tokenNumber = await getNextAppointmentToken(activeHospitalId, apptDate);
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId: activeHospitalId,
        patientId: targetPatientId,
        doctorId: doctorId || null,
        time: time || '10:00 AM',
        date: apptDate,
        tokenNumber,
        status: 'PENDING'
      },
      include: { patient: true, doctor: true }
    });

    await logAudit(req, 'CREATE', 'Appointment', appointment.id, `Created appointment for ${targetName} (Token #${tokenNumber})`);
    res.status(201).json(appointment);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create appointment' }); }
};

export const createPatientAppointment = async (req: AuthRequest, res: Response) => {
  const { hospitalId, doctorId, time, date, patientId } = req.body;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!hospitalId || !date || !time) return res.status(400).json({ error: 'Hospital, date, and time are required' });

  const apptDate = parseDateSafe(date);
  if (!apptDate) {
    return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD or DD/MM/YYYY' });
  }

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

    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const normRequestedTime = normalizeTimeString(time);
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        date: { gte: startOfDay, lte: endOfDay },
        ...(doctorId ? { doctorId } : {}),
        status: { notIn: ['CANCELLED'] },
      },
      select: { time: true }
    });

    const isBooked = existingAppointments.some(a => normalizeTimeString(a.time) === normRequestedTime);
    if (isBooked) {
      return res.status(400).json({ error: `The ${normRequestedTime} slot is already booked. Please select an available time.` });
    }

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
      include: {
        patient: { select: { id: true, name: true, sixDigitId: true, contact: true } },
        doctor: { select: { name: true, specialty: true } },
        hospital: { select: { name: true } }
      },
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

