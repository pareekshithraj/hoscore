import type { Request, Response } from 'express';
import { prisma } from '../index.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (category) where.category = category;
    if (status) where.status = status;
    const expenses = await prisma.expense.findMany({ where, orderBy: { paidDate: 'desc' } });
    res.json(expenses);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch expenses' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const expense = await prisma.expense.create({ data: { ...req.body, hospitalId: hid(req), paidDate: req.body.paidDate ? new Date(req.body.paidDate) : new Date() } });
    res.status(201).json(expense);
  } catch (err) { res.status(500).json({ error: 'Failed to create expense' }); }
};

export const update = async (req: Request, res: Response) => {
  try {
    const expense = await prisma.expense.update({ where: { id: req.params.id! }, data: req.body });
    res.json(expense);
  } catch (err) { res.status(500).json({ error: 'Failed to update expense' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete expense' }); }
};
