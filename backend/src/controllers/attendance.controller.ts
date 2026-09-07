import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as attendanceService from '../services/attendance.service';
import { successResponse, errorResponse } from '../utils/response.utils';

const getClientIP = (req: AuthRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || 'unknown';
};

export const punchIn = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, long } = req.body;
    const ip = getClientIP(req);
    const result = await attendanceService.punchIn(req.user!.id, lat, long, ip);
    successResponse(res, result, 'Punch in successful.');
  } catch (error) {
    next(error);
  }
};

export const punchOut = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lat, long } = req.body;
    const ip = getClientIP(req);
    const result = await attendanceService.punchOut(req.user!.id, lat, long, ip);
    successResponse(res, result, 'Punch out successful.');
  } catch (error) {
    next(error);
  }
};

export const getTodayAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await attendanceService.getTodayAttendance(req.user!.id);
    successResponse(res, result, 'Today attendance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const result = await attendanceService.getMyAttendance(req.user!.id, month, year);
    successResponse(res, result, 'Attendance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getMonthlySummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const result = await attendanceService.getMonthlyAttendanceSummary(
      req.user!.id,
      month,
      year
    );
    successResponse(res, result, 'Monthly summary retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getAllAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, userId, status, page, limit } = req.query;
    const result = await attendanceService.getAllAttendance({
      date: date as string,
      userId: userId as string,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    successResponse(res, result, 'Attendance records retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getUserAttendance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const result = await attendanceService.getUserAttendance(userId, month, year);
    successResponse(res, result, 'User attendance retrieved.');
  } catch (error) {
    next(error);
  }
};

export const manualEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await attendanceService.manualAttendanceEntry(
      req.body,
      req.user!.id
    );
    successResponse(res, result, 'Manual attendance entry created.');
  } catch (error) {
    next(error);
  }
};

export const getAttendanceStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await attendanceService.getAttendanceStats();
    successResponse(res, result, 'Attendance stats retrieved.');
  } catch (error) {
    next(error);
  }
};
