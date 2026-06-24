import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';
import { sendToUser } from '../services/websocket.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

function getRoomForQueue(entry: any) {
  const dept = (entry.department || '').toLowerCase();
  const doc = (entry.doctorName || '').toLowerCase();
  
  if (dept.includes('cardio') || doc.includes('sarah')) return 'Room 102';
  if (dept.includes('pediat') || doc.includes('rahul')) return 'Room 104';
  if (dept.includes('ortho') || doc.includes('anil')) return 'Room 106';
  if (dept.includes('lab') || dept.includes('diagnos')) return 'Lab Room';
  if (dept.includes('bill') || dept.includes('financ')) return 'Billing Desk';
  if (dept.includes('pharm')) return 'Pharmacy';
  return 'Room 101'; // default room
}

async function broadcastQueuePositionUpdates(hospitalId: string | null, doctorId: string | null) {
  if (!hospitalId || !doctorId) return;
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const waitingList = await prisma.oPDQueue.findMany({
      where: {
        hospitalId,
        doctorId,
        status: 'WAITING',
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    const patientIds = waitingList.map((w) => w.patientId).filter((id): id is string => Boolean(id));
    if (patientIds.length === 0) return;

    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, userId: true },
    });
    const patientUserMap = new Map(patients.map((p) => [p.id, p.userId]));

    for (let i = 0; i < waitingList.length; i++) {
      const qItem = waitingList[i];
      if (!qItem.patientId) continue;
      const uId = patientUserMap.get(qItem.patientId);
      if (uId) {
        const position = i + 1;
        const roomName = getRoomForQueue(qItem);
        sendToUser(uId, 'queue_position_update', {
          queueId: qItem.id,
          position,
          doctorName: qItem.doctorName,
          roomName,
        });
      }
    }
  } catch (error) {
    console.error('Error broadcasting queue updates:', error);
  }
}

export const getQueue = async (req: Request, res: Response) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const queue = await prisma.oPDQueue.findMany({
      where: { hospitalId: hid(req), date: { gte: today, lt: tomorrow } },
      orderBy: { tokenNumber: 'asc' },
    });
    const patientIds = queue.map((item) => item.patientId).filter((id): id is string => Boolean(id));
    const patients = patientIds.length
      ? await prisma.patient.findMany({
          where: { id: { in: patientIds } },
          select: { id: true, isHoscoreUser: true, registrationMode: true, manualCareNote: true, sixDigitId: true },
        })
      : [];
    const patientById = new Map(patients.map((patient) => [patient.id, patient]));
    res.json(queue.map((item) => ({ ...item, patient: item.patientId ? patientById.get(item.patientId) : null })));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch queue' }); }
};

export const addToQueue = async (req: Request, res: Response) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const lastToken = await prisma.oPDQueue.findFirst({
      where: { hospitalId: hid(req), date: { gte: today, lt: tomorrow } },
      orderBy: { tokenNumber: 'desc' },
    });
    const tokenNumber = (lastToken?.tokenNumber || 0) + 1;
    let patientId = req.body.patientId || null;
    if (!patientId && req.body.isHoscoreUser === false && req.body.patientName) {
      const patient = await prisma.patient.create({
        data: {
          hospitalId: hid(req),
          name: req.body.patientName,
          contact: req.body.contact || null,
          isHoscoreUser: false,
          registrationMode: 'WALK_IN_MANUAL',
          manualCareNote: req.body.manualCareNote || 'Patient cannot use phone/app. Continue manual care workflow.',
        },
      });
      patientId = patient.id;
    }
    const entry = await prisma.oPDQueue.create({
      data: {
        patientName: req.body.patientName,
        patientId,
        doctorName: req.body.doctorName,
        doctorId: req.body.doctorId || null,
        department: req.body.department || 'General',
        estimatedWait: req.body.estimatedWait || 15,
        notes: req.body.notes || null,
        hospitalId: hid(req),
        tokenNumber,
        date: new Date(),
      },
    });
    await logAudit(req, 'CREATE', 'OPDQueue', entry.id, `Created token ${entry.tokenNumber} for ${entry.patientName}`);
    
    // Broadcast updates to waiting patients
    await broadcastQueuePositionUpdates(entry.hospitalId, entry.doctorId);
    
    res.status(201).json(entry);
  } catch (err) { res.status(500).json({ error: 'Failed to add to queue' }); }
};

export const updateQueueStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const data: any = { status };
    if (status === 'IN_CONSULTATION') data.calledAt = new Date();
    if (status === 'COMPLETED') data.completedAt = new Date();
    
    const entry = await prisma.oPDQueue.update({ where: { id: req.params.id! }, data });
    await logAudit(req, 'UPDATE', 'OPDQueue', entry.id, `Updated token ${entry.tokenNumber} to ${status}`);

    // If patient is called, send direct WebSocket alert
    if (status === 'IN_CONSULTATION' && entry.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: entry.patientId },
        select: { userId: true }
      });
      if (patient?.userId) {
        const roomName = getRoomForQueue(entry);
        sendToUser(patient.userId, 'queue_called', {
          queueId: entry.id,
          doctorName: entry.doctorName,
          department: entry.department,
          tokenNumber: entry.tokenNumber,
          roomName,
        });
      }
    }

    // Broadcast queue updates to all patients waiting for this doctor
    await broadcastQueuePositionUpdates(entry.hospitalId, entry.doctorId);

    res.json(entry);
  } catch (err) { res.status(500).json({ error: 'Failed to update queue' }); }
};

export const deleteFromQueue = async (req: Request, res: Response) => {
  try {
    const entry = await prisma.oPDQueue.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'OPDQueue', entry.id, `Deleted token ${entry.tokenNumber} for ${entry.patientName}`);
    
    // Broadcast queue updates to all patients waiting for this doctor
    await broadcastQueuePositionUpdates(entry.hospitalId, entry.doctorId);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to remove from queue' }); }
};
