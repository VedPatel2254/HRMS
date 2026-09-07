import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as rolePermController from '../controllers/rolePermission.controller';

const router = Router();

router.use(authMiddleware);

router.get('/my-permissions', rolePermController.getUserPermissions);
router.get('/modules', rolePermController.getModules);
router.get('/', roleGuard([Role.ADMIN]), rolePermController.getAllRoles);
router.get('/all', roleGuard([Role.ADMIN]), rolePermController.getAllRolePermissions);
router.get('/:role', roleGuard([Role.ADMIN]), rolePermController.getRolePermissions);
router.put('/', roleGuard([Role.ADMIN]), rolePermController.updateRolePermissions);
router.post('/', roleGuard([Role.ADMIN]), rolePermController.createCustomRole);
router.delete('/:role', roleGuard([Role.ADMIN]), rolePermController.deleteRole);

export default router;
