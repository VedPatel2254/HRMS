import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as helpdeskService from '../services/helpdesk.service';

export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tickets = await helpdeskService.getMyTickets(req.user!.id);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await helpdeskService.createTicket(req.body, req.user!.id);
    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await helpdeskService.getAllTickets(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await helpdeskService.assignTicket(req.params.id, req.body.assignedTo);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const resolveTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await helpdeskService.resolveTicket(req.params.id, req.body.resolution);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const closeTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ticket = await helpdeskService.closeTicket(req.params.id);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};
