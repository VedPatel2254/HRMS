import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as payrollService from '../services/payroll.service';
import { successResponse } from '../utils/response.utils';

export const getMyPayslips = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await payrollService.getMyPayslips(req.user!.id);
    successResponse(res, result, 'Payslips retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getPayslipDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { month, year } = req.params;
    const result = await payrollService.getPayslipDetail(
      req.user!.id,
      parseInt(month),
      parseInt(year),
      req.user!.id,
      ['ADMIN', 'HR'].includes(req.user!.role)
    );
    successResponse(res, result, 'Payslip retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getUserPayslipDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, month, year } = req.params;
    const result = await payrollService.getPayslipDetail(
      userId,
      parseInt(month),
      parseInt(year),
      req.user!.id,
      true
    );
    successResponse(res, result, 'Payslip retrieved.');
  } catch (error) {
    next(error);
  }
};

export const generatePayroll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { month, year } = req.body;
    const result = await payrollService.generatePayroll(
      month,
      year,
      req.user!.id
    );
    successResponse(res, result, 'Payroll generated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAllPayroll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { month, year, status, page, limit } = req.query;
    const result = await payrollService.getAllPayroll({
      month: month ? parseInt(month as string) : undefined,
      year: year ? parseInt(year as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    successResponse(res, result, 'Payroll records retrieved.');
  } catch (error) {
    next(error);
  }
};

export const markAsPaid = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await payrollService.markAsPaid(id);
    successResponse(res, result, 'Payroll marked as paid.');
  } catch (error) {
    next(error);
  }
};

export const addBonus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { bonusAmount } = req.body;
    const result = await payrollService.addBonus(id, bonusAmount);
    successResponse(res, result, 'Bonus added successfully.');
  } catch (error) {
    next(error);
  }
};

export const deletePayroll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await payrollService.deletePayroll(id);
    successResponse(res, null, 'Payroll deleted successfully.');
  } catch (error) {
    next(error);
  }
};
