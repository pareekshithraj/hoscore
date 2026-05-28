import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({ where: { hospitalId: hid(req) }, include: { prescriptions: true } });
    res.json(doctors);
  } catch { res.status(500).json({ error: 'Failed to fetch doctors' }); }
};

export const createDoctor = async (req: Request, res: Response) => {
  const { name, specialty, contact, email } = req.body;
  try {
    const doctor = await prisma.doctor.create({ data: { name, specialty, contact, email, hospitalId: hid(req) } });
    res.status(201).json(doctor);
  } catch { res.status(500).json({ error: 'Failed to create doctor' }); }
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
    const item = await prisma.inventory.create({ data: { itemName, type, stock, reorderLevel, supplier, price, hospitalId: hid(req) } });
    res.status(201).json(item);
  } catch { res.status(500).json({ error: 'Failed to create inventory item' }); }
};

export const updateInventoryStock = async (req: Request, res: Response) => {
  try {
    const item = await prisma.inventory.update({ where: { id: req.params.id }, data: { stock: req.body.stock } });
    res.json(item);
  } catch { res.status(500).json({ error: 'Failed to update inventory stock' }); }
};

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({ where: { hospitalId: hid(req) } });
    res.json(staff);
  } catch { res.status(500).json({ error: 'Failed to fetch staff' }); }
};

export const createStaff = async (req: Request, res: Response) => {
  const { name, role, contact, email } = req.body;
  try {
    const employee = await prisma.staff.create({ data: { name, role, contact, email, hospitalId: hid(req) } });
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
