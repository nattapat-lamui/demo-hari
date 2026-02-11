import { Router } from 'express';
import LeaveRequestController from '../controllers/LeaveRequestController';
import { apiLimiter, validateLeaveRequest, validateRequest } from '../middlewares/security';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { cacheMiddleware, invalidateCache } from '../middlewares/cache';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for medical certificate uploads
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/medical-certs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `cert-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
        }
    },
});

// All routes require authentication
router.use(authenticateToken);

// GET /api/leave-requests - Get all leave requests (any authenticated user) - cached for 30s
router.get('/', cacheMiddleware(), LeaveRequestController.getAllLeaveRequests.bind(LeaveRequestController));

// POST /api/leave-requests - Create leave request (any authenticated user can create their own)
// multer runs BEFORE validators so req.body is populated from multipart fields
router.post(
    '/',
    apiLimiter,
    upload.single('medicalCertificate'),
    validateLeaveRequest,
    validateRequest,
    invalidateCache('/api/leave-requests'),
    LeaveRequestController.createLeaveRequest.bind(LeaveRequestController)
);

// PUT /api/leave-requests/:id - Edit own leave request (any authenticated user)
router.put(
    '/:id',
    apiLimiter,
    upload.single('medicalCertificate'),
    invalidateCache('/api/leave-requests'),
    LeaveRequestController.editLeaveRequest.bind(LeaveRequestController)
);

// PATCH /api/leave-requests/:id - Update leave request status (HR_ADMIN only - for approval/rejection)
router.patch('/:id', requireAdmin, apiLimiter, invalidateCache('/api/leave-requests'), LeaveRequestController.updateLeaveRequest.bind(LeaveRequestController));

// POST /api/leave-requests/:id/cancel - Cancel own leave request (any authenticated user)
router.post('/:id/cancel', apiLimiter, invalidateCache('/api/leave-requests'), LeaveRequestController.cancelLeaveRequest.bind(LeaveRequestController));

// POST /api/leave-requests/:id/cancel-decision - Approve/reject cancel request (HR_ADMIN only)
router.post('/:id/cancel-decision', requireAdmin, apiLimiter, invalidateCache('/api/leave-requests'), LeaveRequestController.handleCancelDecision.bind(LeaveRequestController));

// DELETE /api/leave-requests/:id - Delete leave request (HR_ADMIN only)
router.delete('/:id', requireAdmin, apiLimiter, invalidateCache('/api/leave-requests'), LeaveRequestController.deleteLeaveRequest.bind(LeaveRequestController));

// GET /api/leave-balances/:employeeId - Get leave balances for employee (any authenticated user) - cached for 60s
router.get('/balances/:employeeId', cacheMiddleware(60000), LeaveRequestController.getLeaveBalances.bind(LeaveRequestController));

export default router;
