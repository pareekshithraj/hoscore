import type { Response } from 'express';
import { prisma } from '../index.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { ALL_FEATURES, STAFF_TYPE_PRESETS } from '../utils/features.js';
import { logAudit } from '../utils/auditLogger.js';

function cleanCode(name: string) {
  return name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizePermissions(input: unknown) {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(ALL_FEATURES);
  return input.filter((item): item is string => typeof item === 'string' && allowed.has(item));
}

async function ensureGlobalPresets() {
  for (const preset of STAFF_TYPE_PRESETS) {
    const existing = await prisma.staffType.findFirst({ where: { hospitalId: null, code: preset.code } });
    if (existing) {
      await prisma.staffType.update({
        where: { id: existing.id },
        data: {
          name: preset.name,
          role: preset.role,
          description: preset.description,
          permissions: preset.permissions,
          isPreset: true,
          isActive: true,
        },
      });
    } else {
      await prisma.staffType.create({
        data: {
        hospitalId: null,
        name: preset.name,
        code: preset.code,
        role: preset.role,
        description: preset.description,
        permissions: preset.permissions,
        isPreset: true,
        },
      });
    }
  }
}

export const getFeatureCatalog = async (_req: AuthRequest, res: Response) => {
  res.json({ features: ALL_FEATURES });
};

export const listHospitalStaffTypes = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  try {
    await ensureGlobalPresets();
    const staffTypes = await prisma.staffType.findMany({
      where: {
        isActive: true,
        OR: [{ hospitalId: null }, { hospitalId }],
      },
      orderBy: [{ isPreset: 'desc' }, { name: 'asc' }],
    });
    res.json(staffTypes);
  } catch (error) {
    console.error('Staff type list error:', error);
    res.status(500).json({ error: 'Failed to get staff types' });
  }
};

export const createHospitalStaffType = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  const { name, role, description, permissions } = req.body;
  try {
    const staffType = await prisma.staffType.create({
      data: {
        hospitalId,
        name,
        code: cleanCode(name),
        role: role || 'STAFF',
        description,
        permissions: normalizePermissions(permissions),
        isPreset: false,
      },
    });
    await logAudit(req, 'CREATE', 'StaffType', staffType.id, `Created hospital staff type ${staffType.name}`);
    res.status(201).json(staffType);
  } catch (error) {
    console.error('Staff type create error:', error);
    res.status(500).json({ error: 'Failed to create staff type' });
  }
};

export const updateHospitalStaffType = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  const { name, role, description, permissions } = req.body;
  try {
    const existing = await prisma.staffType.findFirst({ where: { id: req.params.id, hospitalId, isPreset: false } });
    if (!existing) return res.status(404).json({ error: 'Custom staff type not found' });
    const staffType = await prisma.staffType.update({
      where: { id: existing.id },
      data: {
        name,
        role,
        description,
        permissions: normalizePermissions(permissions),
      },
    });
    await logAudit(req, 'UPDATE', 'StaffType', staffType.id, `Updated hospital staff type ${staffType.name}`);
    res.json(staffType);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update staff type' });
  }
};

export const deactivateHospitalStaffType = async (req: AuthRequest, res: Response) => {
  const hospitalId = req.user?.hospitalId;
  if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });

  try {
    const existing = await prisma.staffType.findFirst({ where: { id: req.params.id, hospitalId, isPreset: false } });
    if (!existing) return res.status(404).json({ error: 'Custom staff type not found' });
    const staffType = await prisma.staffType.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    await logAudit(req, 'DEACTIVATE', 'StaffType', staffType.id, `Deactivated hospital staff type ${staffType.name}`);
    res.json(staffType);
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate staff type' });
  }
};

export const listGlobalStaffTypes = async (_req: AuthRequest, res: Response) => {
  try {
    await ensureGlobalPresets();
    const staffTypes = await prisma.staffType.findMany({
      where: { hospitalId: null },
      orderBy: [{ isPreset: 'desc' }, { name: 'asc' }],
    });
    res.json(staffTypes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get global staff types' });
  }
};

export const createGlobalStaffType = async (req: AuthRequest, res: Response) => {
  const { name, role, description, permissions } = req.body;
  try {
    const staffType = await prisma.staffType.create({
      data: {
        hospitalId: null,
        name,
        code: cleanCode(name),
        role: role || 'STAFF',
        description,
        permissions: normalizePermissions(permissions),
        isPreset: true,
      },
    });
    await logAudit(req, 'CREATE', 'GlobalStaffType', staffType.id, `Created global staff type ${staffType.name}`);
    res.status(201).json(staffType);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create global staff type' });
  }
};

export const updateGlobalStaffType = async (req: AuthRequest, res: Response) => {
  const { name, role, description, permissions } = req.body;
  try {
    const existing = await prisma.staffType.findFirst({ where: { id: req.params.id, hospitalId: null } });
    if (!existing) return res.status(404).json({ error: 'Global staff type not found' });
    const staffType = await prisma.staffType.update({
      where: { id: existing.id },
      data: {
        name,
        role,
        description,
        permissions: normalizePermissions(permissions),
      },
    });
    await logAudit(req, 'UPDATE', 'GlobalStaffType', staffType.id, `Updated global staff type ${staffType.name}`);
    res.json(staffType);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update global staff type' });
  }
};

export const deactivateGlobalStaffType = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.staffType.findFirst({ where: { id: req.params.id, hospitalId: null } });
    if (!existing) return res.status(404).json({ error: 'Global staff type not found' });
    const staffType = await prisma.staffType.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
    await logAudit(req, 'DEACTIVATE', 'GlobalStaffType', staffType.id, `Deactivated global staff type ${staffType.name}`);
    res.json(staffType);
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate global staff type' });
  }
};
