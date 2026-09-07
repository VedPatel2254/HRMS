import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as reportService from '../services/report.service';

export const getAttendanceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const report = await reportService.getAttendanceReport(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getPayrollReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const report = await reportService.getPayrollReport(
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getLeaveReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query;
    const report = await reportService.getLeaveReport(
      year ? parseInt(year as string) : undefined
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getHeadcountReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getHeadcountReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getTaskReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getTaskReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};

export const getProjectReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getProjectReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
};
