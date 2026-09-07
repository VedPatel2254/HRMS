import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as taskExtController from '../controllers/taskExt.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { documentUpload } from '../middleware/upload.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get('/', taskController.getAllTasks);
router.post('/', roleGuard([Role.ADMIN, Role.HR, Role.TECH_LEAD]), taskController.createTask);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.put('/:id/status', taskController.updateTaskStatus);
router.post('/:id/comments', taskController.addComment);
router.get('/:id/comments', taskController.getComments);

router.post('/:id/attachments', documentUpload, taskExtController.uploadAttachment);
router.get('/:id/attachments', taskExtController.getAttachments);
router.delete('/:id/attachments/:attachmentId', taskExtController.deleteAttachment);

router.get('/:id/phases', taskExtController.getPhases);
router.post('/:id/phases', taskExtController.createPhase);
router.put('/:id/phases/:phaseId', taskExtController.updatePhase);
router.delete('/:id/phases/:phaseId', taskExtController.deletePhase);

export default router;
