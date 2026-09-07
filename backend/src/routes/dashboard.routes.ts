import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/admin',
  roleGuard([Role.ADMIN, Role.HR]),
  dashboardController.getAdminDashboard
);

router.get('/employee', dashboardController.getEmployeeDashboard);

export default router;
