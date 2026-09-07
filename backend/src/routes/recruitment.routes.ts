import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { Role } from '@prisma/client';
import * as recruitmentController from '../controllers/recruitment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/jobs', recruitmentController.getAllJobPostings);
router.post('/jobs', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.createJobPosting);
router.get('/jobs/:id', recruitmentController.getJobPosting);
router.put('/jobs/:id', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.updateJobPosting);

router.post('/applicants', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.addApplicant);
router.get('/applicants/:id', recruitmentController.getApplicant);
router.put('/applicants/:id/status', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.updateApplicantStatus);

router.post('/applicants/:id/interview', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.scheduleInterview);
router.put('/interviews/:id', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.updateInterview);

router.post('/applicants/:id/hire', roleGuard([Role.ADMIN, Role.HR]), recruitmentController.hireApplicant);

export default router;
