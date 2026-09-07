import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import * as taskService from '../services/task.service';
import { successResponse } from '../utils/response.utils';

export const getAllTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, priority, projectId, assignedTo, dueDateFrom, dueDateTo, page, limit } = req.query;
    const result = await taskService.getAllTasks(req.user!.id, req.user!.role as Role, {
      status: status as string,
      priority: priority as string,
      projectId: projectId as string,
      assignedTo: assignedTo as string,
      dueDateFrom: dueDateFrom as string,
      dueDateTo: dueDateTo as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });
    successResponse(res, result, 'Tasks retrieved.');
  } catch (error) {
    next(error);
  }
};

export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await taskService.createTask(req.body, req.user!.id);
    successResponse(res, result, 'Task created.', 201);
  } catch (error) {
    next(error);
  }
};

export const getTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await taskService.getTask(id, req.user!.id, req.user!.role as Role);
    successResponse(res, result, 'Task retrieved.');
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await taskService.updateTask(id, req.body, req.user!.id, req.user!.role as Role);
    successResponse(res, result, 'Task updated.');
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await taskService.deleteTask(id, req.user!.id, req.user!.role as Role);
    successResponse(res, null, 'Task deleted.');
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await taskService.updateTaskStatus(id, status, req.user!.id);
    successResponse(res, result, 'Task status updated.');
  } catch (error) {
    next(error);
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const result = await taskService.addComment(id, req.user!.id, content);
    successResponse(res, result, 'Comment added.', 201);
  } catch (error) {
    next(error);
  }
};

export const getComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await taskService.getComments(id);
    successResponse(res, result, 'Comments retrieved.');
  } catch (error) {
    next(error);
  }
};

export const getTaskStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await taskService.getTaskStats(req.user!.id, req.user!.role as Role);
    successResponse(res, result, 'Task stats retrieved.');
  } catch (error) {
    next(error);
  }
};
