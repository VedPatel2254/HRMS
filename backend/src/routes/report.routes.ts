import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as reportController from '../controllers/report.controller';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard([Role.ADMIN, Role.HR]));

router.get('/attendance', reportController.getAttendanceReport);
router.get('/payroll', reportController.getPayrollReport);
router.get('/leave', reportController.getLeaveReport);
router.get('/headcount', reportController.getHeadcountReport);
router.get('/tasks', reportController.getTaskReport);
router.get('/projects', reportController.getProjectReport);

export default router;
