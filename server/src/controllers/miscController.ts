import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { ensureDoctorRoster } from '../utils/doctorRoster.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({ where: { hospitalId: hid(req) }, include: { prescriptions: true } });
    res.json(doctors);
  } catch { res.status(500).json({ error: 'Failed to fetch doctors' }); }
};

export const createDoctor = async (req: Request, res: Response) => {
  const { name, specialty, contact, email, status } = req.body;
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });
    const normalizedEmail = email ? String(email).trim().toLowerCase() : '';
    if (normalizedEmail) {
      const existing = await prisma.doctor.findFirst({
        where: { hospitalId, email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
      if (existing) {
        const doctor = await prisma.doctor.update({
          where: { id: existing.id },
          data: { name, specialty, contact, email: normalizedEmail, status: status || existing.status },
        });
        return res.json(doctor);
      }
    }
    const doctor = await prisma.doctor.create({
      data: { name, specialty, contact, email: normalizedEmail || email, status: status || 'ON_DUTY', hospitalId },
    });
    res.status(201).json(doctor);
  } catch { res.status(500).json({ error: 'Failed to create doctor' }); }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.doctor.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Doctor not found' });
    const doctor = await prisma.doctor.update({
      where: { id: existing.id },
      data: req.body,
    });
    res.json(doctor);
  } catch { res.status(500).json({ error: 'Failed to update doctor' }); }
};

export const getAllInventory = async (req: Request, res: Response) => {
  try {
    const items = await prisma.inventory.findMany({ where: { hospitalId: hid(req) } });
    res.json(items);
  } catch { res.status(500).json({ error: 'Failed to fetch inventory' }); }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  const { itemName, type, stock, reorderLevel, supplier, price } = req.body;
  try {
    const item = await prisma.inventory.create({
      data: {
        itemName,
        type,
        stock,
        reorderLevel,
        supplier,
        price,
        batchNumber: req.body.batchNumber || null,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
        hospitalId: hid(req),
      },
    });
    res.status(201).json(item);
  } catch { res.status(500).json({ error: 'Failed to create inventory item' }); }
};

export const updateInventoryStock = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.inventory.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Inventory item not found or access denied' });

    const item = await prisma.inventory.update({
      where: { id: existing.id },
      data: {
        stock: req.body.stock !== undefined ? Number(req.body.stock) : existing.stock,
        batchNumber: req.body.batchNumber !== undefined ? req.body.batchNumber : existing.batchNumber,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : existing.expiryDate,
      },
    });
    res.json(item);
  } catch { res.status(500).json({ error: 'Failed to update inventory stock' }); }
};


export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({ where: { hospitalId: hid(req) } });
    res.json(staff);
  } catch { res.status(500).json({ error: 'Failed to fetch staff' }); }
};

/** Combined staff + membership + doctor names for leave/group/shift pickers. */
export const getRoster = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const [staff, doctors, members] = await Promise.all([
      prisma.staff.findMany({ where: { hospitalId } }),
      prisma.doctor.findMany({ where: { hospitalId }, select: { id: true, name: true, email: true, specialty: true } }),
      prisma.membership.findMany({
        where: { hospitalId, status: 'ACTIVE' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
    const seen = new Set<string>();
    const roster: { id: string; name: string; role: string; email?: string | null; source: string }[] = [];
    const push = (id: string, name: string, role: string, email?: string | null, source = 'staff') => {
      const key = (email || '').toLowerCase() || `${source}:${id}`;
      if (seen.has(key) || seen.has(id)) return;
      seen.add(key);
      seen.add(id);
      roster.push({ id, name, role, email, source });
    };
    for (const m of members) {
      if (m.user?.name) push(m.userId, m.user.name, m.role, m.user.email, 'membership');
    }
    for (const s of staff) push(s.id, s.name, s.role, s.email, 'staff');
    for (const d of doctors) push(d.id, d.name, 'DOCTOR', d.email, 'doctor');
    roster.sort((a, b) => a.name.localeCompare(b.name));
    res.json(roster);
  } catch {
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  const { name, role, contact, email, department } = req.body;
  try {
    const hospitalId = hid(req);
    if (!hospitalId) return res.status(403).json({ error: 'Hospital context required' });
    const employee = await prisma.staff.create({ data: { name, role, contact, email, hospitalId } });
    if (String(role).toUpperCase() === 'DOCTOR') {
      await ensureDoctorRoster(hospitalId, { name, email, contact, specialty: department });
    }
    res.status(201).json(employee);
  } catch { res.status(500).json({ error: 'Failed to create staff member' }); }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    await prisma.doctor.deleteMany({ where: { id: req.params.id, hospitalId: hid(req) } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    await prisma.inventory.deleteMany({ where: { id: req.params.id, hospitalId: hid(req) } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    await prisma.staff.deleteMany({ where: { id: req.params.id, hospitalId: hid(req) } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};
