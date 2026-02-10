"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LeaveRequestController_1 = __importDefault(require("../controllers/LeaveRequestController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const cache_1 = require("../middlewares/cache");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/leave-requests - Get all leave requests (any authenticated user) - cached for 30s
router.get('/', (0, cache_1.cacheMiddleware)(), LeaveRequestController_1.default.getAllLeaveRequests.bind(LeaveRequestController_1.default));
// POST /api/leave-requests - Create leave request (any authenticated user can create their own)
router.post('/', security_1.apiLimiter, security_1.validateLeaveRequest, security_1.validateRequest, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.createLeaveRequest.bind(LeaveRequestController_1.default));
// PATCH /api/leave-requests/:id - Update leave request status (HR_ADMIN only - for approval/rejection)
router.patch('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.updateLeaveRequest.bind(LeaveRequestController_1.default));
// DELETE /api/leave-requests/:id - Delete leave request (HR_ADMIN only)
router.delete('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.deleteLeaveRequest.bind(LeaveRequestController_1.default));
// GET /api/leave-balances/:employeeId - Get leave balances for employee (any authenticated user) - cached for 60s
router.get('/balances/:employeeId', (0, cache_1.cacheMiddleware)(60000), LeaveRequestController_1.default.getLeaveBalances.bind(LeaveRequestController_1.default));
exports.default = router;
