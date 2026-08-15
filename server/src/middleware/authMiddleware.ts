import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { ADMIN_PERMISSIONS } from '../utils/features.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'hoscore-development-secret-key-32chars';

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  contextType: 'hospital' | 'patient' | 'superadmin';
  hospitalId: string | null;
  role: string;
  permissions?: string[];
  impersonating?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

import { permissionsForRole } from '../utils/features.js';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });


  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    
    // Check user suspension status
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, isSuperAdmin: true },
    });
    
    if (!dbUser || !dbUser.isActive) {
      return res.status(401).json({ error: 'Your account has been suspended by an administrator.' });
    }

    decoded.isSuperAdmin = dbUser.isSuperAdmin;

    // Super-admin support session: skip membership, keep admin permissions even if the tenant is paused.
    if (decoded.contextType === 'hospital' && decoded.hospitalId) {
      if (decoded.isSuperAdmin && decoded.impersonating) {
        decoded.role = 'ADMIN';
        decoded.permissions = ADMIN_PERMISSIONS;
      } else {
        const membership = await prisma.membership.findFirst({
          where: { userId: decoded.userId, hospitalId: decoded.hospitalId, status: 'ACTIVE', hospital: { isActive: true } },
          include: { staffType: true },
        });

        if (!membership) {
          return res.status(403).json({ error: 'Your access to this hospital has been revoked or deactivated.' });
        }

        decoded.role = membership.role;
        decoded.permissions = permissionsForRole(membership.role, membership.permissions || membership.staffType?.permissions);
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return next();


  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, isSuperAdmin: true },
    });

    if (dbUser && dbUser.isActive) {
      decoded.isSuperAdmin = dbUser.isSuperAdmin;
      req.user = decoded;
    }
  } catch (_error) {
    // Continue without req.user if token is invalid
  }
  next();
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
    if (req.user.contextType === 'patient') return next();
    // Enforce valid hospital context when accessing hospital features
    if (req.user.contextType !== 'hospital' || !req.user.hospitalId) {
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Hospital context required to access this feature' });
      }
    }
    if (req.user.role === 'ADMIN' || req.user.isSuperAdmin) return next();
    if ((req.user.permissions || []).includes(feature)) return next();
    return res.status(403).json({ error: 'Feature access denied' });
  };
};

export const requireAnyFeature = (...features: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.contextType === 'patient') return next();
    if (req.user.contextType !== 'hospital' || !req.user.hospitalId) {
      if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: 'Hospital context required to access this feature' });
      }
    }
    if (req.user.role === 'ADMIN' || req.user.isSuperAdmin) return next();
    const perms = req.user.permissions || [];
    if (features.some((f) => perms.includes(f))) return next();
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

export const requirePatientContext = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.contextType !== 'patient') {
    return res.status(403).json({ error: 'Patient context required' });
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
