import { Router } from 'express';
import * as leaveController from '../controllers/leave.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get('/types', leaveController.getAllLeaveTypes);
router.post(
  '/types',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.createLeaveType
);

router.get('/balance', leaveController.getLeaveBalance);
router.get(
  '/balance/team',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.getTeamLeaveBalance
);
router.get(
  '/balance/:userId',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.getUserLeaveBalance
);

router.post('/apply', leaveController.applyLeave);
router.get('/my', leaveController.getMyLeaveRequests);

router.get(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.getAllLeaveRequests
);

router.put(
  '/:id/approve',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.approveLeave
);
router.put(
  '/:id/reject',
  roleGuard([Role.ADMIN, Role.HR]),
  leaveController.rejectLeave
);
router.put('/:id/cancel', leaveController.cancelLeave);

router.get('/calendar', leaveController.getTeamLeaveCalendar);

export default router;
