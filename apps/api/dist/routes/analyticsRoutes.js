"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalyticsController_1 = __importDefault(require("../controllers/AnalyticsController"));
const auth_1 = require("../middlewares/auth");
const cache_1 = require("../middlewares/cache");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/analytics/headcount-stats - Get headcount statistics (last 6 months) - cached for 5 minutes
router.get('/headcount-stats', (0, cache_1.cacheMiddleware)(300000), AnalyticsController_1.default.getHeadcountStats.bind(AnalyticsController_1.default));
// GET /api/analytics/compliance - Get compliance data - cached for 10 minutes
router.get('/compliance', (0, cache_1.cacheMiddleware)(600000), AnalyticsController_1.default.getCompliance.bind(AnalyticsController_1.default));
// GET /api/analytics/sentiment - Get sentiment statistics - cached for 5 minutes
router.get('/sentiment', (0, cache_1.cacheMiddleware)(300000), AnalyticsController_1.default.getSentiment.bind(AnalyticsController_1.default));
// GET /api/analytics/audit-logs - Get audit logs - cached for 1 minute (more dynamic data)
router.get('/audit-logs', (0, cache_1.cacheMiddleware)(60000), AnalyticsController_1.default.getAuditLogs.bind(AnalyticsController_1.default));
exports.default = router;
