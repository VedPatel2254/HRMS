import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as leaveService from '../services/leave.service';
import { successResponse } from '../utils/response.utils';

export const getAllLeaveTypes = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await leaveService.getAllLeaveTypes();
    successResponse(res, result, 'Leave types retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createLeaveType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await leaveService.createLeaveType(req.body);
    successResponse(res, result, 'Leave type created.', 201);
  } catch (error) {
    next(error);
  }
};

export const getLeaveBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const result = await leaveService.getLeaveBalance(req.user!.id, year);
    successResponse(res, result, 'Leave balance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getUserLeaveBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const result = await leaveService.getLeaveBalance(userId, year);
    successResponse(res, result, 'User leave balance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getTeamLeaveBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const result = await leaveService.getTeamLeaveBalance(year);
    successResponse(res, result, 'Team leave balance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const applyLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await leaveService.applyLeave(req.user!.id, req.body);
    successResponse(res, result, 'Leave applied successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getMyLeaveRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, leaveTypeId, page, limit } = req.query;
    const result = await leaveService.getMyLeaveRequests(req.user!.id, {
      status: status as string,
      leaveTypeId: leaveTypeId as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });
    successResponse(res, result, 'Leave requests retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAllLeaveRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, leaveTypeId, userId, fromDate, toDate, page, limit } = req.query;
    const result = await leaveService.getAllLeaveRequests({
      status: status as string,
      leaveTypeId: leaveTypeId as string,
      userId: userId as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    successResponse(res, result, 'All leave requests retrieved.');
  } catch (error) {
    next(error);
  }
};

export const approveLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = await leaveService.approveLeave(id, req.user!.id, note);
    successResponse(res, result, 'Leave approved.');
  } catch (error) {
    next(error);
  }
};

export const rejectLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const result = await leaveService.rejectLeave(id, req.user!.id, note);
    successResponse(res, result, 'Leave rejected.');
  } catch (error) {
    next(error);
  }
};

export const cancelLeave = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await leaveService.cancelLeave(id, req.user!.id);
    successResponse(res, result, 'Leave cancelled.');
  } catch (error) {
    next(error);
  }
};

export const getTeamLeaveCalendar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const result = await leaveService.getTeamLeaveCalendar(month, year);
    successResponse(res, result, 'Team leave calendar retrieved.');
  } catch (error) {
    next(error);
  }
};
