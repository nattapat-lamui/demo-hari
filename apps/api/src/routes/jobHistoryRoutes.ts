import { Router } from 'express';
import JobHistoryController from '../controllers/JobHistoryController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken, requireAdmin, requireAdminOrManager } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/job-history - Get job history (optionally filtered by employeeId)
router.get('/', JobHistoryController.getJobHistory.bind(JobHistoryController));

// POST /api/job-history - Add new job history entry (admin/manager only)
router.post('/', apiLimiter, requireAdminOrManager, JobHistoryController.createJobHistory.bind(JobHistoryController));

// PUT /api/job-history/:id - Update existing entry (admin/manager only)
router.put('/:id', apiLimiter, requireAdminOrManager, JobHistoryController.updateJobHistory.bind(JobHistoryController));

// DELETE /api/job-history/:id - Delete entry (admin only)
router.delete('/:id', apiLimiter, requireAdmin, JobHistoryController.deleteJobHistory.bind(JobHistoryController));

export default router;
