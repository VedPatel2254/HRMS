import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as expenseController from '../controllers/expense.controller';

const router = Router();

router.use(authMiddleware);

router.get('/my', expenseController.getMyExpenses);
router.post('/', expenseController.createExpense);
router.get('/', roleGuard([Role.ADMIN, Role.HR]), expenseController.getAllExpenses);
router.put('/:id/approve', roleGuard([Role.ADMIN, Role.HR]), expenseController.approveExpense);
router.put('/:id/reject', roleGuard([Role.ADMIN, Role.HR]), expenseController.rejectExpense);
router.put('/:id/pay', roleGuard([Role.ADMIN, Role.HR]), expenseController.markAsPaid);
router.delete('/:id', expenseController.deleteExpense);

export default router;
