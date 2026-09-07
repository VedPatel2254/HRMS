import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get('/', projectController.getAllProjects);
router.post(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  projectController.createProject
);
router.get(
  '/stats',
  roleGuard([Role.ADMIN, Role.HR]),
  projectController.getProjectStats
);
router.get('/:id', projectController.getProject);
router.put(
  '/:id',
  roleGuard([Role.ADMIN, Role.HR]),
  projectController.updateProject
);
router.delete(
  '/:id',
  roleGuard([Role.ADMIN]),
  projectController.archiveProject
);
router.post(
  '/:id/members',
  roleGuard([Role.ADMIN, Role.HR]),
  projectController.addMember
);
router.delete(
  '/:id/members/:userId',
  roleGuard([Role.ADMIN, Role.HR]),
  projectController.removeMember
);
router.get('/:id/tasks', projectController.getProjectTasks);

export default router;
