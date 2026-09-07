import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';
import { successResponse, errorResponse } from '../utils/response.utils';

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getNotifications(
      req.user!.id,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );
    successResponse(res, result, 'Notifications retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user!.id);
    successResponse(res, null, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    successResponse(res, null, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};
