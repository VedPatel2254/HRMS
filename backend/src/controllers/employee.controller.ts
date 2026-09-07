import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as employeeService from '../services/employee.service';
import { successResponse, errorResponse } from '../utils/response.utils';

export const getAllEmployees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, search, role, status } = req.query;
    const result = await employeeService.getAllEmployees({
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      search: search as string,
      role: role as string,
      status: status as string,
    });
    successResponse(res, result, 'Employees retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await employeeService.createEmployee(req.body);
    successResponse(res, result, 'Employee created successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await employeeService.getEmployee(
      id,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, result, 'Employee retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await employeeService.updateEmployee(
      id,
      req.body,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, result, 'Employee updated successfully.');
  } catch (error) {
    next(error);
  }
};

export const deactivateEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await employeeService.deactivateEmployee(id);
    successResponse(res, result, 'Employee deactivated successfully.');
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.file) {
      errorResponse(res, 'No file uploaded.', 400);
      return;
    }
    const result = await employeeService.uploadDocument(id, req.file);
    successResponse(res, result, 'Document uploaded successfully.', 201);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await employeeService.getDocuments(id);
    successResponse(res, result, 'Documents retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, fileName } = req.params;
    const result = await employeeService.deleteDocument(id, fileName);
    successResponse(res, result, 'Document deleted successfully.');
  } catch (error) {
    next(error);
  }
};

export const getEmployeeStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await employeeService.getEmployeeStats();
    successResponse(res, result, 'Employee stats retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
