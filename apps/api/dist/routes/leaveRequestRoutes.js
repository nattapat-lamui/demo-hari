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
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/leave-requests - Get all leave requests (any authenticated user) - cached for 30s
router.get('/', (0, cache_1.cacheMiddleware)(), LeaveRequestController_1.default.getAllLeaveRequests.bind(LeaveRequestController_1.default));
// POST /api/leave-requests - Create leave request (any authenticated user can create their own)
// multer runs BEFORE validators so req.body is populated from multipart fields
router.post('/', security_1.apiLimiter, upload_1.medicalCertUpload.single('medicalCertificate'), security_1.validateLeaveRequest, security_1.validateRequest, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.createLeaveRequest.bind(LeaveRequestController_1.default));
// PUT /api/leave-requests/:id - Edit own leave request (any authenticated user)
router.put('/:id', security_1.apiLimiter, upload_1.medicalCertUpload.single('medicalCertificate'), (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.editLeaveRequest.bind(LeaveRequestController_1.default));
// PATCH /api/leave-requests/:id - Update leave request status (HR_ADMIN only - for approval/rejection)
router.patch('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.updateLeaveRequest.bind(LeaveRequestController_1.default));
// POST /api/leave-requests/:id/cancel - Cancel own leave request (any authenticated user)
router.post('/:id/cancel', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.cancelLeaveRequest.bind(LeaveRequestController_1.default));
// POST /api/leave-requests/:id/cancel-decision - Approve/reject cancel request (HR_ADMIN only)
router.post('/:id/cancel-decision', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.handleCancelDecision.bind(LeaveRequestController_1.default));
// GET /api/leave-requests/:id/medical-certificate - Download medical certificate
router.get('/:id/medical-certificate', LeaveRequestController_1.default.downloadMedicalCertificate.bind(LeaveRequestController_1.default));
// DELETE /api/leave-requests/:id - Delete leave request (HR_ADMIN only)
router.delete('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.deleteLeaveRequest.bind(LeaveRequestController_1.default));
// GET /api/leave-balances/:employeeId - Get leave balances for employee (any authenticated user) - cached for 60s
router.get('/balances/:employeeId', (0, cache_1.cacheMiddleware)(60000), LeaveRequestController_1.default.getLeaveBalances.bind(LeaveRequestController_1.default));
exports.default = router;
