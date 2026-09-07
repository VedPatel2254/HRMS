import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as rolePermService from '../services/rolePermission.service';
import { successResponse } from '../utils/response.utils';

export const getAllRoles = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await rolePermService.getAllRoles();
    successResponse(res, roles, 'Roles retrieved.');
  } catch (error) { next(error); }
};

export const getRolePermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await rolePermService.getRolePermissions(req.params.role);
    successResponse(res, permissions, 'Permissions retrieved.');
  } catch (error) { next(error); }
};

export const getAllRolePermissions = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await rolePermService.getAllRolePermissions();
    successResponse(res, permissions, 'All permissions retrieved.');
  } catch (error) { next(error); }
};

export const updateRolePermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, permissions } = req.body;
    const result = await rolePermService.updateRolePermissions(role, permissions);
    successResponse(res, result, 'Permissions updated.');
  } catch (error) { next(error); }
};

export const createCustomRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { roleName, permissions } = req.body;
    const result = await rolePermService.createCustomRole(roleName, permissions);
    successResponse(res, result, 'Custom role created.', 201);
  } catch (error) { next(error); }
};

export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await rolePermService.deleteRole(req.params.role);
    successResponse(res, null, 'Role deleted.');
  } catch (error) { next(error); }
};

export const getModules = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    successResponse(res, rolePermService.getModules(), 'Modules retrieved.');
  } catch (error) { next(error); }
};

export const getUserPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await rolePermService.getUserPermissions(req.user!.role);
    successResponse(res, permissions, 'User permissions retrieved.');
  } catch (error) { next(error); }
};
