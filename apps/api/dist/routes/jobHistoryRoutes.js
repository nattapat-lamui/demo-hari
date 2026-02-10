"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const JobHistoryController_1 = __importDefault(require("../controllers/JobHistoryController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/job-history - Get job history (optionally filtered by employeeId)
router.get('/', JobHistoryController_1.default.getJobHistory.bind(JobHistoryController_1.default));
// POST /api/job-history - Add new job history entry
router.post('/', security_1.apiLimiter, JobHistoryController_1.default.createJobHistory.bind(JobHistoryController_1.default));
exports.default = router;
