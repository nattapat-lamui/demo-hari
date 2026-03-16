import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import EmployeeLeaveQuotaController from '../controllers/EmployeeLeaveQuotaController';
import { apiLimiter, validateEmployeeCreation, validateRequest } from '../middlewares/security';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { cacheMiddleware, invalidateCache } from '../middlewares/cache';
import { avatarUpload, generateStorageKey, getFileBuffer } from '../middlewares/upload';
import { storageService } from '../services/StorageService';
import { getStatusMap } from '../socket';
import { query } from '../db';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /api/employees/upload-avatar - Upload avatar image
router.post('/upload-avatar', apiLimiter, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const key = generateStorageKey('avatars', req.file, 'avatar');
        const buffer = getFileBuffer(req.file);
        await storageService.upload({ key, body: buffer, contentType: req.file.mimetype });

        // For avatars: return public URL (R2) or relative path (local)
        const avatarUrl = storageService.getPublicUrl(key) || `/uploads/${key}`;
        res.status(200).json({
            success: true,
            avatarUrl,
            message: 'Avatar uploaded successfully'
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// GET /api/employees/statuses - Get all availability statuses (for initial load)
router.get('/statuses', (_req, res) => {
    const statusMap = getStatusMap();
    const statuses: Record<string, { status: string; statusMessage: string; updatedAt: string }> = {};
    statusMap.forEach((val, key) => { statuses[key] = val; });
    res.json(statuses);
});

// PATCH /api/employees/:id/availability-status - Update availability status (REST fallback)
router.patch('/:id/availability-status', apiLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, statusMessage } = req.body;
        const validStatuses = ['online', 'busy', 'away', 'offline'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: online, busy, away, offline' });
        }
        const msg = typeof statusMessage === 'string' ? statusMessage.slice(0, 100) : '';
        await query(
            'UPDATE employees SET availability_status = $1, status_message = $2 WHERE id = $3',
            [status, msg, id]
        );
        // Update in-memory map too
        const statusMapRef = getStatusMap();
        statusMapRef.set(id, { status, statusMessage: msg, updatedAt: new Date().toISOString() });
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating availability status:', error);
        res.status(500).json({ error: 'Failed to update availability status' });
    }
});

// GET /api/employees - Get all employees (any authenticated user) - cached for 30s
router.get('/', cacheMiddleware(), EmployeeController.getAllEmployees.bind(EmployeeController));

// GET /api/employees/:id/leave-quotas - Get effective leave quotas for employee
router.get('/:id/leave-quotas', EmployeeLeaveQuotaController.getEffectiveQuotas.bind(EmployeeLeaveQuotaController));

// PUT /api/employees/:id/leave-quotas - Upsert leave quota overrides (Admin only)
router.put('/:id/leave-quotas', requireAdmin, apiLimiter, EmployeeLeaveQuotaController.upsertOverrides.bind(EmployeeLeaveQuotaController));

// DELETE /api/employees/:id/leave-quotas/:type - Delete a single leave quota override (Admin only)
router.delete('/:id/leave-quotas/:type', requireAdmin, apiLimiter, EmployeeLeaveQuotaController.deleteOverride.bind(EmployeeLeaveQuotaController));

// GET /api/employees/:id/manager - Get employee's manager (any authenticated user) - cached for 30s
router.get('/:id/manager', cacheMiddleware(), EmployeeController.getEmployeeManager.bind(EmployeeController));

// GET /api/employees/:id/direct-reports - Get employee's direct reports (any authenticated user) - cached for 30s
router.get('/:id/direct-reports', cacheMiddleware(), EmployeeController.getEmployeeDirectReports.bind(EmployeeController));

// GET /api/employees/:id - Get employee by ID (any authenticated user) - cached for 30s
router.get('/:id', cacheMiddleware(), EmployeeController.getEmployeeById.bind(EmployeeController));

// POST /api/employees - Create new employee (HR_ADMIN only)
router.post(
    '/',
    requireAdmin,
    apiLimiter,
    validateEmployeeCreation,
    validateRequest,
    invalidateCache('/api/employees'),
    EmployeeController.createEmployee.bind(EmployeeController)
);

// PATCH /api/employees/:id - Update own profile (any authenticated user) or any employee (HR_ADMIN)
router.patch('/:id', apiLimiter, invalidateCache('/api/employees'), EmployeeController.updateEmployee.bind(EmployeeController));

// PUT /api/employees/:id - Update employee (HR_ADMIN only)
router.put('/:id', requireAdmin, apiLimiter, invalidateCache('/api/employees'), EmployeeController.updateEmployee.bind(EmployeeController));

// DELETE /api/employees/:id - Delete employee (HR_ADMIN only)
router.delete('/:id', requireAdmin, apiLimiter, invalidateCache('/api/employees'), EmployeeController.deleteEmployee.bind(EmployeeController));

export default router;
