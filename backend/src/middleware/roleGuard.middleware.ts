import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { errorResponse } from '../utils/response.utils';
import { Role } from '@prisma/client';
import { getUserPermissions } from '../services/rolePermission.service';

export const roleGuard = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required.', 401);
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      errorResponse(res, 'Access denied. Insufficient permissions.', 403);
      return;
    }

    next();
  };
};

export const permissionGuard = (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport') => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        errorResponse(res, 'Authentication required.', 401);
        return;
      }

      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      const permissions = await getUserPermissions(req.user.role);
      const modulePerms = permissions[module];

      if (!modulePerms || !modulePerms[action]) {
        errorResponse(res, `Access denied. Missing permission: ${module}.${action}`, 403);
        return;
      }

      next();
    } catch (error) {
      errorResponse(res, 'Permission check failed.', 500);
    }
  };
};
