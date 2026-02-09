import { Router } from 'express';
import TrainingController from '../controllers/TrainingController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/training/modules - Get all training modules
router.get('/modules', TrainingController.getAllModules.bind(TrainingController));

// GET /api/training/employee/:employeeId - Get training for specific employee
router.get('/employee/:employeeId', TrainingController.getEmployeeTraining.bind(TrainingController));

// POST /api/training/assign - Assign training to employee (Admin)
router.post('/assign', apiLimiter, TrainingController.assignTraining.bind(TrainingController));

// PATCH /api/training/:id - Update training status/progress
router.patch('/:id', apiLimiter, TrainingController.updateTraining.bind(TrainingController));

export default router;
