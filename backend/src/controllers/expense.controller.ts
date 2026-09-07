import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as expenseService from '../services/expense.service';

export const getMyExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expenses = await expenseService.getMyExpenses(req.user!.id);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user!.id);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

export const getAllExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await expenseService.getAllExpenses(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const approveExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.approveExpense(req.params.id, req.user!.id, req.body.reviewerNote);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const rejectExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.rejectExpense(req.params.id, req.user!.id, req.body.reviewerNote);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const markAsPaid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.markAsPaid(req.params.id);
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user!.id, req.user!.role as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
