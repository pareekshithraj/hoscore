import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { signUrl } from '../services/r2.js';
import { pick } from '../utils/pick.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (category) where.category = category;
    if (status) where.status = status;
    const expenses = await prisma.expense.findMany({ where, orderBy: { paidDate: 'desc' } });
    const signedExpenses = await Promise.all(expenses.map(async (e) => ({
      ...e,
      receipt: e.receipt ? await signUrl(e.receipt) : null,
    })));
    res.json(signedExpenses);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch expenses' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const safeData = pick(req.body, ['title', 'amount', 'category', 'notes', 'status', 'receipt', 'vendor', 'paidBy']);
    const expense = await prisma.expense.create({ data: { ...safeData, hospitalId: hid(req), paidDate: req.body.paidDate ? new Date(req.body.paidDate) : new Date() } });
    const signedReceipt = expense.receipt ? await signUrl(expense.receipt) : null;
    res.status(201).json({ ...expense, receipt: signedReceipt });
  } catch (err) { res.status(500).json({ error: 'Failed to create expense' }); }
};

export const update = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    const safeData = pick(req.body, ['title', 'amount', 'category', 'notes', 'status', 'receipt', 'vendor', 'paidBy']);
    if (req.body.paidDate) (safeData as any).paidDate = new Date(req.body.paidDate);
    const expense = await prisma.expense.update({ where: { id: req.params.id! }, data: safeData });
    const signedReceipt = expense.receipt ? await signUrl(expense.receipt) : null;
    res.json({ ...expense, receipt: signedReceipt });
  } catch (err) { res.status(500).json({ error: 'Failed to update expense' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Expense not found' });
    await prisma.expense.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete expense' }); }
};
