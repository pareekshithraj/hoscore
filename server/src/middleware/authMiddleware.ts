import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ADMIN_PERMISSIONS } from '../utils/features.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hoscore-secret-key';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  contextType: 'hospital' | 'patient' | 'superadmin';
  hospitalId: string | null;
  role: string;
  permissions?: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

export const requireFeature = (feature: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'ADMIN' || req.user.isSuperAdmin) return next();
    if ((req.user.permissions || []).includes(feature)) return next();
    return res.status(403).json({ error: 'Feature access denied' });
  };
};

// Ensures the user is in a hospital context
export const requireHospitalContext = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.hospitalId || req.user.contextType !== 'hospital') {
    return res.status(403).json({ error: 'Hospital context required' });
  }
  next();
};

// Ensures the user is a super admin
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Helper to get hospitalId from auth context
export function getHospitalId(req: AuthRequest): string | null {
  return req.user?.hospitalId || null;
}

export function getPermissions(req: AuthRequest): string[] {
  if (req.user?.role === 'ADMIN' || req.user?.isSuperAdmin) return ADMIN_PERMISSIONS;
  return req.user?.permissions || [];
}
