import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  clientController.getAllClients
);
router.post(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  clientController.createClient
);
router.get(
  '/stats',
  roleGuard([Role.ADMIN, Role.HR]),
  clientController.getClientStats
);
router.get(
  '/:id',
  roleGuard([Role.ADMIN, Role.HR]),
  clientController.getClient
);
router.put(
  '/:id',
  roleGuard([Role.ADMIN, Role.HR]),
  clientController.updateClient
);
router.delete(
  '/:id',
  roleGuard([Role.ADMIN]),
  clientController.deactivateClient
);

export default router;
