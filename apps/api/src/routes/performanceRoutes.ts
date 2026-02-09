import { Router } from 'express';
import PerformanceController from '../controllers/PerformanceController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/performance/reviews - Get performance reviews (optionally filtered by employeeId)
router.get('/reviews', PerformanceController.getPerformanceReviews.bind(PerformanceController));

export default router;
