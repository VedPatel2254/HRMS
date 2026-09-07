import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import * as projectService from '../services/project.service';
import { successResponse } from '../utils/response.utils';

export const getAllProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, priority, page, limit } = req.query;
    const result = await projectService.getAllProjects(
      req.user!.id,
      req.user!.role as Role,
      {
        search: search as string,
        status: status as string,
        priority: priority as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      }
    );
    successResponse(res, result, 'Projects retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await projectService.createProject(req.body, req.user!.id);
    successResponse(res, result, 'Project created.', 201);
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await projectService.getProject(id, req.user!.id, req.user!.role as Role);
    successResponse(res, result, 'Project retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await projectService.updateProject(id, req.body);
    successResponse(res, result, 'Project updated.');
  } catch (error) {
    next(error);
  }
};

export const archiveProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await projectService.archiveProject(id);
    successResponse(res, result, 'Project archived.');
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const result = await projectService.addMember(id, userId, role);
    successResponse(res, result, 'Member added.', 201);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, userId } = req.params;
    await projectService.removeMember(id, userId);
    successResponse(res, null, 'Member removed.');
  } catch (error) {
    next(error);
  }
};

export const getProjectTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await projectService.getProjectTasks(id);
    successResponse(res, result, 'Project tasks retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getProjectStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await projectService.getProjectStats();
    successResponse(res, result, 'Project stats retrieved.');
  } catch (error) {
    next(error);
  }
};
