import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as recruitmentService from '../services/recruitment.service';

export const getAllJobPostings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await recruitmentService.getAllJobPostings(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await recruitmentService.createJobPosting(req.body, req.user!.id);
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

export const getJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await recruitmentService.getJobPosting(req.params.id);
    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const updateJobPosting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await recruitmentService.updateJobPosting(req.params.id, req.body);
    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const addApplicant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applicant = await recruitmentService.addApplicant(req.body);
    res.status(201).json(applicant);
  } catch (error) {
    next(error);
  }
};

export const getApplicant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const applicant = await recruitmentService.getApplicant(req.params.id);
    res.json(applicant);
  } catch (error) {
    next(error);
  }
};

export const updateApplicantStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;
    const applicant = await recruitmentService.updateApplicantStatus(
      req.params.id,
      status,
      notes
    );
    res.json(applicant);
  } catch (error) {
    next(error);
  }
};

export const scheduleInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interview = await recruitmentService.scheduleInterview(req.params.id, req.body);
    res.status(201).json(interview);
  } catch (error) {
    next(error);
  }
};

export const updateInterview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const interview = await recruitmentService.updateInterview(req.params.id, req.body);
    res.json(interview);
  } catch (error) {
    next(error);
  }
};

export const hireApplicant = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await recruitmentService.hireApplicant(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
