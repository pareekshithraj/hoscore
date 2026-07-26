import type { Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { broadcastToHospital } from '../services/websocket.js';

const hid = (req: AuthRequest) => req.user?.hospitalId;

// Default seed floor so a brand-new hospital opens the builder with something
// sensible rather than an empty grid.
function defaultFloors(cols: number, rows: number) {
  const blank = () =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'empty'));
  return [
    { id: 'gf', label: 'Ground Floor', index: 0, cells: blank(), anchors: [] },
  ];
}

// ---------------- STAFF: read & save the map ----------------

export const getMap = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    let map = await prisma.hospitalMap.findUnique({ where: { hospitalId } });
    if (!map) {
      map = await prisma.hospitalMap.create({
        data: { hospitalId, floors: defaultFloors(20, 14) as any },
      });
    }
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch map' });
  }
};

export const saveMap = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { name, cols, rows, floors, isPublished } = req.body ?? {};
    if (!Array.isArray(floors)) {
      return res.status(400).json({ error: 'floors must be an array' });
    }

    const existing = await prisma.hospitalMap.findUnique({ where: { hospitalId } });
    const data = {
      name: typeof name === 'string' ? name : undefined,
      cols: Number.isInteger(cols) ? cols : undefined,
      rows: Number.isInteger(rows) ? rows : undefined,
      floors: floors as any,
      isPublished: typeof isPublished === 'boolean' ? isPublished : undefined,
      version: (existing?.version ?? 0) + 1,
    };

    const map = existing
      ? await prisma.hospitalMap.update({ where: { hospitalId }, data })
      : await prisma.hospitalMap.create({ data: { hospitalId, ...data } });

    // Keep every connected web/app client in sync live.
    broadcastToHospital(hospitalId, 'map:updated', { version: map.version });
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save map' });
  }
};

// ---------------- LIVE POSITIONS (staff manage) ----------------

export const getLivePositions = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });
    const positions = await prisma.livePosition.findMany({
      where: { hospitalId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
};

export const upsertLivePosition = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

    const { subjectType, subjectId, label, floorId, cellR, cellC, note } = req.body ?? {};
    if (!subjectId || !floorId || !Number.isInteger(cellR) || !Number.isInteger(cellC)) {
      return res.status(400).json({ error: 'subjectId, floorId, cellR, cellC are required' });
    }

    const existing = await prisma.livePosition.findFirst({
      where: { hospitalId, subjectId, subjectType: subjectType || 'PATIENT', status: 'ACTIVE' },
    });

    const position = existing
      ? await prisma.livePosition.update({
          where: { id: existing.id },
          data: { label, floorId, cellR, cellC, note, updatedBy: req.user?.userId },
        })
      : await prisma.livePosition.create({
          data: {
            hospitalId,
            subjectType: subjectType || 'PATIENT',
            subjectId,
            label,
            floorId,
            cellR,
            cellC,
            note,
            updatedBy: req.user?.userId,
          },
        });

    broadcastToHospital(hospitalId, 'position:updated', position);
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update position' });
  }
};

export const endLivePosition = async (req: AuthRequest, res: Response) => {
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });
    await prisma.livePosition.updateMany({
      where: { id: req.params.id, hospitalId },
      data: { status: 'ENDED' },
    });
    broadcastToHospital(hospitalId, 'position:ended', { id: req.params.id });
    res.json({ message: 'Ended' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end position' });
  }
};

// ---------------- PATIENT: my location + share ----------------

// Resolve the patient profile for the authenticated patient (or a dependent).
async function resolvePatientProfile(userId: string, targetPatientId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patientProfile: true },
  });
  if (!user?.patientProfile) return null;
  if (!targetPatientId || targetPatientId === user.patientProfile.id) return user.patientProfile;
  const dependent = await prisma.patient.findFirst({
    where: { id: targetPatientId, parentId: user.patientProfile.id },
  });
  return dependent ?? null;
}

// Patient sees, for their current admission, the hospital's published map + the
// bed/room they are in, so the app/web can render "you are here" and directions.
export const getMyLocation = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await resolvePatientProfile(req.user!.userId, req.query.patientId as string);
    if (!profile) return res.status(404).json({ error: 'Patient profile not found' });

    const admission = await prisma.admission.findFirst({
      where: { patientId: profile.id, status: { in: ['Active', 'Admitted'] } },
      include: { bed: { include: { room: { include: { hospital: { select: { id: true, name: true } } } } } } },
      orderBy: { admissionDate: 'desc' },
    });

    if (!admission) {
      return res.json({ admitted: false, map: null, position: null });
    }

    const hospitalId = admission.bed.room.hospitalId;
    const [map, position] = await Promise.all([
      prisma.hospitalMap.findFirst({ where: { hospitalId, isPublished: true } }),
      prisma.livePosition.findFirst({
        where: { hospitalId, subjectId: profile.id, subjectType: 'PATIENT', status: 'ACTIVE' },
      }),
    ]);

    res.json({
      admitted: true,
      hospital: admission.bed.room.hospital,
      room: { id: admission.bed.room.id, name: admission.bed.room.name, type: admission.bed.room.type },
      bed: { id: admission.bed.id, bedNumber: admission.bed.bedNumber },
      map,
      position,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};

// Patient (or staff acting for them) mints a family-facing share link for a
// live position. Returns an opaque token that the public endpoint below reads.
export const shareMyLocation = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await resolvePatientProfile(req.user!.userId, req.body?.patientId);
    if (!profile) return res.status(404).json({ error: 'Patient profile not found' });

    const admission = await prisma.admission.findFirst({
      where: { patientId: profile.id, status: { in: ['Active', 'Admitted'] } },
      include: { bed: { include: { room: true } } },
      orderBy: { admissionDate: 'desc' },
    });
    if (!admission) return res.status(400).json({ error: 'Not currently admitted' });

    const hospitalId = admission.bed.room.hospitalId;
    const existing = await prisma.livePosition.findFirst({
      where: { hospitalId, subjectId: profile.id, subjectType: 'PATIENT', status: 'ACTIVE' },
    });
    if (!existing) {
      return res.status(404).json({ error: 'No live location set by hospital yet' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const hours = Math.min(Number(req.body?.expiresHours) || 24, 168);
    const updated = await prisma.livePosition.update({
      where: { id: existing.id },
      data: { shareToken: token, shareExpires: new Date(Date.now() + hours * 3600_000) },
    });

    res.json({ shareToken: token, expiresAt: updated.shareExpires });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share link' });
  }
};

// ---------------- PUBLIC: family opens a share link ----------------

export const getSharedLocation = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.params.token;
    const position = await prisma.livePosition.findUnique({ where: { shareToken: token } });
    if (!position || position.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Share link not found or ended' });
    }
    if (position.shareExpires && position.shareExpires < new Date()) {
      return res.status(410).json({ error: 'Share link expired' });
    }

    const map = await prisma.hospitalMap.findFirst({
      where: { hospitalId: position.hospitalId, isPublished: true },
    });
    const hospital = await prisma.hospital.findUnique({
      where: { id: position.hospitalId },
      select: { name: true, address: true, city: true },
    });

    res.json({
      hospital,
      label: position.label,
      note: position.note,
      floorId: position.floorId,
      cell: { r: position.cellR, c: position.cellC },
      map,
      updatedAt: position.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load shared location' });
  }
};

// ---------------- PUBLIC: patient-facing published map for a hospital ----------------

export const getPublicMap = async (req: AuthRequest, res: Response) => {
  try {
    const map = await prisma.hospitalMap.findFirst({
      where: { hospitalId: req.params.hospitalId, isPublished: true },
    });
    if (!map) return res.status(404).json({ error: 'No published map for this hospital' });
    res.json(map);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch map' });
  }
};
