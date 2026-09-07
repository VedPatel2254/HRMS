import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as settingsService from '../services/settings.service';
import { successResponse } from '../utils/response.utils';

export const getCompanySettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getCompanySettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.updateCompanySettings(req.body);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE',
        entity: 'Settings',
        entityId: '1',
        details: 'Updated company settings',
        ipAddress: req.ip,
      });
    }
    successResponse(res, settings, 'Settings updated');
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query;
    const holidays = await settingsService.getHolidays(
      year ? parseInt(year as string) : undefined
    );
    successResponse(res, holidays);
  } catch (error) {
    next(error);
  }
};

export const createHoliday = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const holiday = await settingsService.createHoliday(req.body);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'CREATE',
        entity: 'Holiday',
        entityId: holiday.id,
        details: `Created holiday: ${req.body.name}`,
        ipAddress: req.ip,
      });
    }
    successResponse(res, holiday, 'Holiday created', 201);
  } catch (error) {
    next(error);
  }
};

export const updateHoliday = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const holiday = await settingsService.updateHoliday(req.params.id, req.body);
    successResponse(res, holiday, 'Holiday updated');
  } catch (error) {
    next(error);
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await settingsService.deleteHoliday(req.params.id);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'DELETE',
        entity: 'Holiday',
        entityId: req.params.id,
        details: 'Deleted holiday',
        ipAddress: req.ip,
      });
    }
    successResponse(res, null, 'Holiday deleted');
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, role, status, search } = req.query;
    const users = await settingsService.getAllUsers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      role: role as string,
      status: status as string,
      search: search as string,
    });
    successResponse(res, users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const user = await settingsService.updateUserRole(req.params.id, role);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'UPDATE_ROLE',
        entity: 'User',
        entityId: req.params.id,
        details: `Changed role to ${role}`,
        ipAddress: req.ip,
      });
    }
    successResponse(res, user, 'Role updated');
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await settingsService.deactivateUser(req.params.id);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'DEACTIVATE',
        entity: 'User',
        entityId: req.params.id,
        details: 'Deactivated user',
        ipAddress: req.ip,
      });
    }
    successResponse(res, user, 'User deactivated');
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await settingsService.resetUserPassword(req.params.id);
    if (req.user) {
      await settingsService.createAuditLog({
        userId: req.user.id,
        action: 'RESET_PASSWORD',
        entity: 'User',
        entityId: req.params.id,
        details: 'Reset user password',
        ipAddress: req.ip,
      });
    }
    successResponse(res, result, 'Password reset');
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, userId, action, entity, fromDate, toDate } = req.query;
    const logs = await settingsService.getAuditLogs({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      userId: userId as string,
      action: action as string,
      entity: entity as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
    });
    successResponse(res, logs);
  } catch (error) {
    next(error);
  }
};
