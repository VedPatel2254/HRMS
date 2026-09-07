import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as helpdeskController from '../controllers/helpdesk.controller';

const router = Router();

router.use(authMiddleware);

router.get('/my', helpdeskController.getMyTickets);
router.post('/', helpdeskController.createTicket);
router.get('/', roleGuard([Role.ADMIN, Role.HR]), helpdeskController.getAllTickets);
router.put('/:id/assign', roleGuard([Role.ADMIN, Role.HR]), helpdeskController.assignTicket);
router.put('/:id/resolve', roleGuard([Role.ADMIN, Role.HR]), helpdeskController.resolveTicket);
router.put('/:id/close', helpdeskController.closeTicket);

export default router;
