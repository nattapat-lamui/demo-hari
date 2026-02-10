"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PerformanceController_1 = __importDefault(require("../controllers/PerformanceController"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/performance/reviews - Get performance reviews (optionally filtered by employeeId)
router.get('/reviews', PerformanceController_1.default.getPerformanceReviews.bind(PerformanceController_1.default));
exports.default = router;
