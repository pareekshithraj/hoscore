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
  const { name, type, capacity } = req.body;
  try {
    const room = await prisma.room.create({ data: { hospitalId: hid(req)!, name, type, capacity } });
    res.status(201).json(room);
  } catch (error) { res.status(500).json({ error: 'Failed to create room' }); }
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
