import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController';
import { authenticateToken } from '../middlewares/auth';
import { cacheMiddleware } from '../middlewares/cache';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/analytics/headcount-stats - Get headcount statistics (last 6 months) - cached for 5 minutes
router.get('/headcount-stats', cacheMiddleware(300000), AnalyticsController.getHeadcountStats.bind(AnalyticsController));

// GET /api/analytics/compliance - Get compliance data - cached for 10 minutes
router.get('/compliance', cacheMiddleware(600000), AnalyticsController.getCompliance.bind(AnalyticsController));

// GET /api/analytics/sentiment - Get sentiment statistics - cached for 5 minutes
router.get('/sentiment', cacheMiddleware(300000), AnalyticsController.getSentiment.bind(AnalyticsController));

// GET /api/analytics/audit-logs - Get audit logs - cached for 1 minute (more dynamic data)
router.get('/audit-logs', cacheMiddleware(60000), AnalyticsController.getAuditLogs.bind(AnalyticsController));

export default router;
