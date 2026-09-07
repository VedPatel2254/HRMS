import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as announcementController from '../controllers/announcement.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', announcementController.getAnnouncements);
router.post('/', roleGuard([Role.ADMIN, Role.HR]), announcementController.createAnnouncement);
router.put('/:id', roleGuard([Role.ADMIN, Role.HR]), announcementController.updateAnnouncement);
router.delete('/:id', roleGuard([Role.ADMIN, Role.HR]), announcementController.deleteAnnouncement);

export default router;
