import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as assetController from '../controllers/asset.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard([Role.ADMIN, Role.HR]), assetController.getAllAssets);
router.post('/', roleGuard([Role.ADMIN, Role.HR]), assetController.createAsset);
router.put('/:id', roleGuard([Role.ADMIN, Role.HR]), assetController.updateAsset);
router.post('/:id/assign', roleGuard([Role.ADMIN, Role.HR]), assetController.assignAsset);
router.post('/:id/return', roleGuard([Role.ADMIN, Role.HR]), assetController.returnAsset);

export default router;
