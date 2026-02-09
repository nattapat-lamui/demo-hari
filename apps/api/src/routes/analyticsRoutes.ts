import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics/headcount-stats - Get headcount statistics (last 6 months)
router.get('/headcount-stats', AnalyticsController.getHeadcountStats.bind(AnalyticsController));

// GET /api/analytics/compliance - Get compliance data
router.get('/compliance', AnalyticsController.getCompliance.bind(AnalyticsController));

// GET /api/analytics/sentiment - Get sentiment statistics
router.get('/sentiment', AnalyticsController.getSentiment.bind(AnalyticsController));

// GET /api/analytics/audit-logs - Get audit logs
router.get('/audit-logs', AnalyticsController.getAuditLogs.bind(AnalyticsController));

export default router;
