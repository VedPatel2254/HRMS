import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.post('/punch-in', attendanceController.punchIn);
router.post('/punch-out', attendanceController.punchOut);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/my', attendanceController.getMyAttendance);
router.get('/my/summary', attendanceController.getMonthlySummary);

router.get(
  '/stats/today',
  roleGuard([Role.ADMIN, Role.HR]),
  attendanceController.getAttendanceStats
);

router.get(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  attendanceController.getAllAttendance
);

router.get(
  '/:userId',
  roleGuard([Role.ADMIN, Role.HR]),
  attendanceController.getUserAttendance
);

router.post(
  '/manual',
  roleGuard([Role.ADMIN, Role.HR]),
  attendanceController.manualEntry
);

export default router;
