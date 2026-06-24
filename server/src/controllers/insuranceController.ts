import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { signUrl } from '../services/r2.js';

async function signDocumentsField(documentsStr: string | null | undefined): Promise<string | null> {
  if (!documentsStr) return null;
  const urls = documentsStr.split(',').map(u => u.trim());
  const signedUrls = await Promise.all(urls.map(u => signUrl(u)));
  return signedUrls.filter(Boolean).join(', ');
}

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAll = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { hospitalId: hid(req) };
    if (status) where.status = status;
    const claims = await prisma.insuranceClaim.findMany({ where, orderBy: { createdAt: 'desc' } });
    const signedClaims = await Promise.all(claims.map(async (c) => ({
      ...c,
      documents: await signDocumentsField(c.documents),
    })));
    res.json(signedClaims);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch claims' }); }
};

export const create = async (req: Request, res: Response) => {
  try {
    const claim = await prisma.insuranceClaim.create({ data: { ...req.body, hospitalId: hid(req) } });
    const signedDocuments = await signDocumentsField(claim.documents);
    res.status(201).json({ ...claim, documents: signedDocuments });
  } catch (err) { res.status(500).json({ error: 'Failed to create claim' }); }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.insuranceClaim.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Insurance claim not found' });
    const data: any = { ...req.body };
    if (['APPROVED', 'REJECTED'].includes(data.status)) data.reviewedAt = new Date();
    const claim = await prisma.insuranceClaim.update({ where: { id: req.params.id! }, data });
    const signedDocuments = await signDocumentsField(claim.documents);
    res.json({ ...claim, documents: signedDocuments });
  } catch (err) { res.status(500).json({ error: 'Failed to update claim' }); }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.insuranceClaim.findFirst({ where: { id: req.params.id!, hospitalId: hid(req) } });
    if (!existing) return res.status(404).json({ error: 'Insurance claim not found' });
    await prisma.insuranceClaim.delete({ where: { id: req.params.id! } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete claim' }); }
};
