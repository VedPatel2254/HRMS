import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as performanceController from '../controllers/performance.controller';

const router = Router();

router.use(authMiddleware);

router.get('/goals/my', performanceController.getMyGoals);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

router.get('/reviews/my', performanceController.getMyReviews);
router.get('/reviews', roleGuard([Role.ADMIN, Role.HR]), performanceController.getAllReviews);
router.post('/reviews', roleGuard([Role.ADMIN, Role.HR]), performanceController.startReviewCycle);
router.put('/reviews/:id/self', performanceController.submitSelfRating);
router.put('/reviews/:id/manager', roleGuard([Role.ADMIN, Role.HR, Role.EMPLOYEE]), performanceController.submitManagerRating);

router.get('/goals', roleGuard([Role.ADMIN, Role.HR]), performanceController.getAllGoals);

export default router;
