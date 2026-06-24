import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllBeds = async (req: Request, res: Response) => {
  try {
    const beds = await prisma.bed.findMany({ where: { room: { hospitalId: hid(req) } }, include: { room: true } });
    res.json(beds);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch beds' }); }
};

export const createBed = async (req: Request, res: Response) => {
  const { roomId, bedNumber, pricePerDay } = req.body;
  try {
    const room = await prisma.room.findFirst({ where: { id: roomId, hospitalId: hid(req) } });
    if (!room) return res.status(403).json({ error: 'Access denied: Room does not belong to your hospital' });
    const bed = await prisma.bed.create({ data: { roomId, bedNumber, pricePerDay } });
    res.status(201).json(bed);
  } catch (error) { res.status(500).json({ error: 'Failed to create bed' }); }
};

export const updateBedStatus = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.bed.findFirst({ where: { id: req.params.id, room: { hospitalId: hid(req) } } });
    if (!existing) return res.status(404).json({ error: 'Bed not found' });
    const bed = await prisma.bed.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(bed);
  } catch (error) { res.status(500).json({ error: 'Failed to update bed status' }); }
};

export const deleteBed = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.bed.findFirst({ where: { id: req.params.id, room: { hospitalId: hid(req) } } });
    if (!existing) return res.status(404).json({ error: 'Bed not found' });
    await prisma.bed.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};
