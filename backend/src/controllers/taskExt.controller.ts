import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response.utils';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const uploadAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      errorResponse(res, 'No file uploaded.', 400);
      return;
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      errorResponse(res, 'Task not found.', 404);
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user!.id,
      },
    });

    successResponse(res, attachment, 'Attachment uploaded.', 201);
  } catch (error) { next(error); }
};

export const getAttachments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId: req.params.id },
      include: {
        uploader: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    successResponse(res, attachments, 'Attachments retrieved.');
  } catch (error) { next(error); }
};

export const deleteAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await prisma.taskAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.taskId !== id) {
      errorResponse(res, 'Attachment not found.', 404);
      return;
    }

    const filePath = path.join(process.cwd(), 'uploads', path.basename(attachment.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.taskAttachment.delete({ where: { id: attachmentId } });
    successResponse(res, null, 'Attachment deleted.');
  } catch (error) { next(error); }
};

export const getPhases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phases = await prisma.taskPhase.findMany({
      where: { taskId: req.params.id },
      orderBy: { order: 'asc' },
    });
    successResponse(res, phases, 'Phases retrieved.');
  } catch (error) { next(error); }
};

export const createPhase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, order } = req.body;

    const maxOrder = await prisma.taskPhase.findFirst({
      where: { taskId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const phase = await prisma.taskPhase.create({
      data: {
        taskId: id,
        title,
        description,
        order: order ?? (maxOrder ? maxOrder.order + 1 : 0),
      },
    });

    successResponse(res, phase, 'Phase created.', 201);
  } catch (error) { next(error); }
};

export const updatePhase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phaseId } = req.params;
    const { title, description, status, order } = req.body;

    const phase = await prisma.taskPhase.update({
      where: { id: phaseId },
      data: { title, description, status, order },
    });

    successResponse(res, phase, 'Phase updated.');
  } catch (error) { next(error); }
};

export const deletePhase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.taskPhase.delete({ where: { id: req.params.phaseId } });
    successResponse(res, null, 'Phase deleted.');
  } catch (error) { next(error); }
};
