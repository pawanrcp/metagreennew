import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

export const JWT_SECRET = process.env.JWT_SECRET || 'metagreen_enterprise_jwt_secret_key_2026';

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  organizationId: string;
  organizationName: string;
  isSuperAdmin: boolean;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

export function generateToken(payload: { id: string; email: string; roleId: string; organizationId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or malformed.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      roleId: string;
      organizationId: string;
    };

    // Load fresh user data directly from database to prevent stale claims
    const user = db.findById<any>('users', decoded.id);
    if (!user || user.status !== 'Active') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is deactivated or no longer exists.',
      });
      return;
    }

    // Load role & permissions directly from database
    const role = db.findById<any>('roles', user.roleId);
    if (!role || role.status !== 'active') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Assigned role is disabled or invalid.',
      });
      return;
    }

    // Combine role permissions + user-specific additional permissions
    const permissionsSet = new Set<string>(role.permissions || []);
    if (Array.isArray(user.customPermissions)) {
      for (const p of user.customPermissions) {
        permissionsSet.add(p);
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: role.id,
      roleName: role.name,
      roleCode: role.code,
      organizationId: user.organizationId,
      organizationName: user.organizationName || user.companyName,
      isSuperAdmin: Boolean(user.isSuperAdmin || role.code === 'SUPER_ADMIN'),
      permissions: Array.from(permissionsSet),
    };

    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is invalid or has expired.',
    });
  }
}
