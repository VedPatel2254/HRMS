import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as announcementService from '../services/announcement.service';

export const getAnnouncements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcements = await announcementService.getAnnouncements(req.user!.id);
    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.createAnnouncement(
      req.body,
      req.user!.id
    );
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      req.body
    );
    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
