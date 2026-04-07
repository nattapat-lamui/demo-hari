import { Router } from 'express';
import TrainingController from '../controllers/TrainingController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken, requireAdmin, requireAdminOrManager } from '../middlewares/auth';
import { cacheMiddleware, invalidateCache } from '../middlewares/cache';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Module CRUD
router.get('/modules', cacheMiddleware(), TrainingController.getAllModules.bind(TrainingController));
router.get('/modules/:id', cacheMiddleware(), TrainingController.getModuleById.bind(TrainingController));
router.post('/modules', requireAdmin, apiLimiter, invalidateCache('/api/training'), TrainingController.createModule.bind(TrainingController));
router.put('/modules/:id', requireAdmin, apiLimiter, invalidateCache('/api/training'), TrainingController.updateModule.bind(TrainingController));
router.delete('/modules/:id', requireAdmin, apiLimiter, invalidateCache('/api/training'), TrainingController.deleteModule.bind(TrainingController));

// Employee training
router.get('/employee/:employeeId', TrainingController.getEmployeeTraining.bind(TrainingController));
router.post('/assign', requireAdminOrManager, apiLimiter, invalidateCache('/api/training'), TrainingController.assignTraining.bind(TrainingController));
router.post('/bulk-assign', requireAdminOrManager, apiLimiter, invalidateCache('/api/training'), TrainingController.bulkAssignTraining.bind(TrainingController));
router.patch('/:id', apiLimiter, invalidateCache('/api/training'), TrainingController.updateTraining.bind(TrainingController));
router.delete('/:id', requireAdminOrManager, apiLimiter, invalidateCache('/api/training'), TrainingController.deleteTraining.bind(TrainingController));

// Analytics
router.get('/analytics', requireAdminOrManager, cacheMiddleware(60000), TrainingController.getAnalytics.bind(TrainingController));

export default router;
