import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

router.use(authMiddleware);

router.get('/company', settingsController.getCompanySettings);
router.get('/holidays', settingsController.getHolidays);

router.use(roleGuard([Role.ADMIN]));

router.put('/company', settingsController.updateCompanySettings);
router.post('/holidays', settingsController.createHoliday);
router.put('/holidays/:id', settingsController.updateHoliday);
router.delete('/holidays/:id', settingsController.deleteHoliday);
router.get('/users', settingsController.getAllUsers);
router.put('/users/:id/role', settingsController.updateUserRole);
router.put('/users/:id/deactivate', settingsController.deactivateUser);
router.post('/users/:id/reset-password', settingsController.resetUserPassword);
router.get('/audit-logs', settingsController.getAuditLogs);

export default router;
