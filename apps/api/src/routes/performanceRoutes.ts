import { Router } from 'express';
import PerformanceController from '../controllers/PerformanceController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/performance/reviews - Get performance reviews (optionally filtered by employeeId)
router.get('/reviews', PerformanceController.getPerformanceReviews.bind(PerformanceController));

// POST /api/performance/reviews - Create a new review
router.post('/reviews', PerformanceController.createReview.bind(PerformanceController));

// PUT /api/performance/reviews/:id - Update a review
router.put('/reviews/:id', PerformanceController.updateReview.bind(PerformanceController));

// DELETE /api/performance/reviews/:id - Delete a review
router.delete('/reviews/:id', PerformanceController.deleteReview.bind(PerformanceController));

export default router;
