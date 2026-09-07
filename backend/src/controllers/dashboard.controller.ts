import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as dashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/response.utils';

export const getAdminDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await dashboardService.getAdminDashboardStats(req.user!.id);
    successResponse(res, result, 'Admin dashboard stats retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await dashboardService.getEmployeeDashboardStats(req.user!.id);
    successResponse(res, result, 'Employee dashboard stats retrieved.');
  } catch (error) {
    next(error);
  }
};
