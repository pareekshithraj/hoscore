import type { Request, Response } from 'express';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.staffGroup.findMany({ where: { hospitalId: hid(req) }, include: { members: true }, orderBy: { createdAt: 'desc' } });
    res.json(groups);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch groups' }); }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;
    const group = await prisma.staffGroup.create({ data: { name, description, color, hospitalId: hid(req) } });
    await logAudit(req, 'CREATE', 'StaffGroup', group.id, `Created staff group ${group.name}`);
    res.status(201).json(group);
  } catch (err) { res.status(500).json({ error: 'Failed to create group' }); }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const group = await prisma.staffGroup.update({ where: { id: req.params.id! }, data: req.body });
    await logAudit(req, 'UPDATE', 'StaffGroup', group.id, `Updated staff group ${group.name}`);
    res.json(group);
  } catch (err) { res.status(500).json({ error: 'Failed to update group' }); }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const group = await prisma.staffGroup.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'StaffGroup', group.id, `Deleted staff group ${group.name}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete group' }); }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const { groupId, staffId, doctorId, memberName, role } = req.body;
    const member = await prisma.groupMember.create({ data: { groupId, staffId, doctorId, memberName, role } });
    await logAudit(req, 'CREATE', 'GroupMember', member.id, `Added ${memberName} to group`);
    res.status(201).json(member);
  } catch (err) { res.status(500).json({ error: 'Failed to add member' }); }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const member = await prisma.groupMember.delete({ where: { id: req.params.id! } });
    await logAudit(req, 'DELETE', 'GroupMember', member.id, `Removed ${member.memberName} from group`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to remove member' }); }
};
