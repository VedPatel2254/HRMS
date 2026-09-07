import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as performanceService from '../services/performance.service';

export const getMyGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await performanceService.getMyGoals(req.user!.id);
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await performanceService.createGoal(req.body, req.user!.id);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.body.status && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Only ADMIN or SUPER_ADMIN can update goal status.' });
      return;
    }
    const goal = await performanceService.updateGoal(req.params.id, req.body);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await performanceService.deleteGoal(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await performanceService.getMyReviews(req.user!.id);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await performanceService.getAllReviews(req.query);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const startReviewCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await performanceService.startReviewCycle(req.body, req.user!.id);
    res.status(201).json(reviews);
  } catch (error) {
    next(error);
  }
};

export const submitSelfRating = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await performanceService.submitSelfRating(
      req.params.id,
      req.user!.id,
      req.body
    );
    res.json(review);
  } catch (error) {
    next(error);
  }
};

export const submitManagerRating = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await performanceService.submitManagerRating(req.params.id, req.body);
    res.json(review);
  } catch (error) {
    next(error);
  }
};

export const getAllGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goals = await performanceService.getAllGoals(req.query);
    res.json(goals);
  } catch (error) {
    next(error);
  }
};
