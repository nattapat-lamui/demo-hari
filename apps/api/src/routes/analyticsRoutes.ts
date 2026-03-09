import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

// GET /api/analytics/dashboard - All analytics data in one call
router.get('/dashboard', AnalyticsController.getDashboard.bind(AnalyticsController));

// GET /api/analytics/headcount-stats - Standalone headcount (used by AdminDashboard)
router.get('/headcount-stats', AnalyticsController.getHeadcountStats.bind(AnalyticsController));

// GET /api/analytics/audit-logs - In-memory audit logs (used by AdminDashboard)
router.get('/audit-logs', AnalyticsController.getAuditLogs.bind(AnalyticsController));

export default router;
