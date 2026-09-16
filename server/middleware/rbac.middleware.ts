import { Request, Response, NextFunction } from 'express';

/**
 * Dynamic RBAC authorization middleware.
 * Checks permission using Module -> Resource -> Action format (e.g. 'crm:leads:view').
 * Super Admin automatically bypasses permission checks.
 */
export function authorize(module: string, resource: string, action: string) {
  const requiredCode = `${module}:${resource}:${action}`.toLowerCase();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required before authorization checks.',
      });
      return;
    }

    // Super Admin has universal access
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check user's dynamic database-driven permissions
    const hasPermission = req.user.permissions.some(
      (perm) => perm.toLowerCase() === requiredCode || perm === '*'
    );

    if (!hasPermission) {
      res.status(403).json({
        error: 'Forbidden',
        message: `You do not possess the required permission: [${requiredCode}]. Contact your Super Admin to update your role permissions.`,
        requiredPermission: requiredCode,
      });
      return;
    }

    next();
  };
}
