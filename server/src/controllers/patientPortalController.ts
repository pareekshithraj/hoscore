import type { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json([]);
    const appointments = await prisma.appointment.findMany({
      where: { patientId: user.patientProfile.id },
      include: { hospital: { select: { name: true } }, doctor: { select: { name: true, specialty: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(appointments);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getMyPrescriptions = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json([]);
    const rxs = await prisma.prescription.findMany({
      where: { patientId: user.patientProfile.id },
      include: { doctor: { select: { name: true, specialty: true } }, hospital: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(rxs);
  } catch (error) { res.status(500).json({ error: 'Failed' }); }
};

export const getMyRecords = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json({ vitals: [], labs: [], admissions: [] });
    const pid = user.patientProfile.id;
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
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json([]);
    const admissions = await prisma.admission.findMany({
      where: { patientId: user.patientProfile.id },
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
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { patientProfile: true } });
    if (!user?.patientProfile) return res.json({ upcoming: [], recentRx: [], profile: null });
    const pid = user.patientProfile.id;
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
    res.json({ upcoming, recentRx, profile: user.patientProfile });
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

    if (appointment.patientId !== user.patientProfile.id) {
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
    if (!appointment || appointment.patientId !== user.patientProfile.id) return res.status(404).json({ error: 'Appointment not found' });
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
    if (!appointment || appointment.patientId !== user.patientProfile.id) return res.status(404).json({ error: 'Appointment not found' });
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
