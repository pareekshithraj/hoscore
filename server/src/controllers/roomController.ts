import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({ where: { hospitalId: hid(req) }, include: { beds: true } });
    res.json(rooms);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch rooms' }); }
};

export const createRoom = async (req: Request, res: Response) => {
  const { name, type, capacity, basePrice } = req.body;
  try {
    const room = await prisma.room.create({
      data: {
        hospitalId: hid(req)!,
        name,
        type,
        capacity: Number(capacity) || 1,
        basePrice: Number(basePrice) || 50,
      },
    });
    res.status(201).json(room);
  } catch (error) { res.status(500).json({ error: 'Failed to create room' }); }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.room.findFirst({ where: { id: req.params.id, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Room not found' });
    const { name, type, capacity, basePrice } = req.body;
    const room = await prisma.room.update({
      where: { id: existing.id },
      data: {
        ...(name != null ? { name } : {}),
        ...(type != null ? { type } : {}),
        ...(capacity != null ? { capacity: Number(capacity) } : {}),
        ...(basePrice != null ? { basePrice: Number(basePrice) } : {}),
      },
    });
    res.json(room);
  } catch (error) { res.status(500).json({ error: 'Failed to update room' }); }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.findFirst({ where: { id: req.params.id, hospitalId: hid(req) }, include: { beds: true } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch room' }); }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    await prisma.room.deleteMany({ where: { id: req.params.id, hospitalId: hid(req) } });
    res.json({ message: 'Deleted successfully' });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
};
