import { Router } from 'express';
import * as employeeController from '../controllers/employee.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { documentUpload } from '../middleware/upload.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.get(
  '/stats',
  roleGuard([Role.ADMIN, Role.HR]),
  employeeController.getEmployeeStats
);

router.get(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  employeeController.getAllEmployees
);

router.post(
  '/',
  roleGuard([Role.ADMIN, Role.HR]),
  employeeController.createEmployee
);

router.get('/:id', employeeController.getEmployee);

router.put(
  '/:id',
  employeeController.updateEmployee
);

router.delete(
  '/:id',
  roleGuard([Role.ADMIN]),
  employeeController.deactivateEmployee
);

router.post(
  '/:id/documents',
  documentUpload,
  employeeController.uploadDocument
);

router.get('/:id/documents', employeeController.getDocuments);

router.delete(
  '/:id/documents/:fileName',
  roleGuard([Role.ADMIN, Role.HR]),
  employeeController.deleteDocument
);

export default router;
