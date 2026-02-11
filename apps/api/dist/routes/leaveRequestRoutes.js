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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Configure multer for medical certificate uploads
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/medical-certs');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `cert-${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
        }
    },
});
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/leave-requests - Get all leave requests (any authenticated user) - cached for 30s
router.get('/', (0, cache_1.cacheMiddleware)(), LeaveRequestController_1.default.getAllLeaveRequests.bind(LeaveRequestController_1.default));
// POST /api/leave-requests - Create leave request (any authenticated user can create their own)
// multer runs BEFORE validators so req.body is populated from multipart fields
router.post('/', security_1.apiLimiter, upload.single('medicalCertificate'), security_1.validateLeaveRequest, security_1.validateRequest, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.createLeaveRequest.bind(LeaveRequestController_1.default));
// PATCH /api/leave-requests/:id - Update leave request status (HR_ADMIN only - for approval/rejection)
router.patch('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.updateLeaveRequest.bind(LeaveRequestController_1.default));
// POST /api/leave-requests/:id/cancel - Cancel own pending leave request (any authenticated user)
router.post('/:id/cancel', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.cancelLeaveRequest.bind(LeaveRequestController_1.default));
// DELETE /api/leave-requests/:id - Delete leave request (HR_ADMIN only)
router.delete('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/leave-requests'), LeaveRequestController_1.default.deleteLeaveRequest.bind(LeaveRequestController_1.default));
// GET /api/leave-balances/:employeeId - Get leave balances for employee (any authenticated user) - cached for 60s
router.get('/balances/:employeeId', (0, cache_1.cacheMiddleware)(60000), LeaveRequestController_1.default.getLeaveBalances.bind(LeaveRequestController_1.default));
exports.default = router;
