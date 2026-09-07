import { Router } from 'express';
import * as payrollController from '../controllers/payroll.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get('/my', payrollController.getMyPayslips);
router.get('/my/:month/:year', payrollController.getPayslipDetail);

router.post(
  '/generate',
  roleGuard([Role.ADMIN, Role.HR]),
  payrollController.generatePayroll
);

router.get(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  payrollController.getAllPayroll
);

router.get(
  '/:userId/:month/:year',
  roleGuard([Role.ADMIN, Role.HR]),
  payrollController.getUserPayslipDetail
);

router.put(
  '/:id/mark-paid',
  roleGuard([Role.ADMIN, Role.HR]),
  payrollController.markAsPaid
);

router.post(
  '/:id/bonus',
  roleGuard([Role.ADMIN, Role.HR]),
  payrollController.addBonus
);

router.delete(
  '/:id',
  roleGuard([Role.ADMIN]),
  payrollController.deletePayroll
);

export default router;
