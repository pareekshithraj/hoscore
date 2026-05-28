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

export const createAppointment = async (req: Request, res: Response) => {
  const { hospitalId, patientName, doctorId, time, date, contact, email, isHoscoreUser, manualCareNote } = req.body;
  try {
    let patient = await prisma.patient.findFirst({ where: { OR: [{ email: email || undefined }, { name: patientName }] } });
    if (!patient) {
      const shouldCreateHoscoreId = isHoscoreUser !== false;
      patient = await prisma.patient.create({
        data: {
          name: patientName,
          email: email || undefined,
          contact: contact || undefined,
          hospitalId: hospitalId || hid(req),
          isHoscoreUser: shouldCreateHoscoreId,
          registrationMode: shouldCreateHoscoreId ? 'HOSCORE' : 'WALK_IN_MANUAL',
          manualCareNote: shouldCreateHoscoreId ? null : manualCareNote || 'Patient does not use phone/app. Continue manual care workflow.',
        },
      });
    }
    const tokenNumber = Math.floor(Math.random() * 50) + 1;
    const appointment = await prisma.appointment.create({
      data: { hospitalId: hospitalId || hid(req), patientId: patient.id, doctorId: doctorId || null, time, date: new Date(date), tokenNumber, status: 'PENDING' },
    });
    res.status(201).json(appointment);
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to create appointment' }); }
};

export const createPatientAppointment = async (req: AuthRequest, res: Response) => {
  const { hospitalId, doctorId, time, date } = req.body;
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!hospitalId || !date || !time) return res.status(400).json({ error: 'Hospital, date, and time are required' });

  try {
    const hospital = await prisma.hospital.findFirst({ where: { id: hospitalId, isActive: true } });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });

    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient || patient.isHoscoreUser === false) {
      return res.status(403).json({ error: 'A HOSCORE patient profile is required to book appointments online' });
    }

    const tokenNumber = Math.floor(Math.random() * 50) + 1;
    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: patient.id,
        doctorId: doctorId || null,
        time,
        date: new Date(date),
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
    const appointment = await prisma.appointment.update({ where: { id: req.params.id }, data: { status: 'COMPLETED' } });
    res.json(appointment);
  } catch { res.status(500).json({ error: 'Failed to check in appointment' }); }
};

export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};
