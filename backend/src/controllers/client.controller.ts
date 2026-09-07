import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as clientService from '../services/client.service';
import { successResponse } from '../utils/response.utils';

export const getAllClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await clientService.getAllClients({
      search: search as string,
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    successResponse(res, result, 'Clients retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await clientService.createClient(req.body, req.user!.id);
    successResponse(res, result, 'Client created.', 201);
  } catch (error) {
    next(error);
  }
};

export const getClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await clientService.getClient(id);
    successResponse(res, result, 'Client retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await clientService.updateClient(id, req.body, req.user!.id);
    successResponse(res, result, 'Client updated.');
  } catch (error) {
    next(error);
  }
};

export const deactivateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await clientService.deactivateClient(id, req.user!.id);
    successResponse(res, result, 'Client deactivated.');
  } catch (error) {
    next(error);
  }
};

export const getClientStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await clientService.getClientStats();
    successResponse(res, result, 'Client stats retrieved.');
  } catch (error) {
    next(error);
  }
};
