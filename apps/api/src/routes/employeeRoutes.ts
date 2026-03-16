import { Router } from 'express';
import EmployeeController from '../controllers/EmployeeController';
import EmployeeLeaveQuotaController from '../controllers/EmployeeLeaveQuotaController';
import { apiLimiter, validateEmployeeCreation, validateRequest } from '../middlewares/security';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { cacheMiddleware, invalidateCache } from '../middlewares/cache';
import { avatarUpload, csvUpload, generateStorageKey, getFileBuffer } from '../middlewares/upload';
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

// POST /api/employees/import-csv - Bulk import employees from CSV (HR_ADMIN only)
router.post('/import-csv', requireAdmin, apiLimiter, csvUpload.single('file'), invalidateCache('/api/employees'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const { parse } = await import('csv-parse/sync');
        const buffer = req.file.buffer || require('fs').readFileSync(req.file.path);
        const csvContent = buffer.toString('utf-8');

        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
        }) as Record<string, string>[];

        if (records.length === 0) {
            return res.status(400).json({ error: 'CSV file is empty' });
        }

        // Validate required columns
        const requiredColumns = ['name', 'email', 'role', 'department'];
        const headers = Object.keys(records[0]);
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            return res.status(400).json({ error: `Missing required columns: ${missingColumns.join(', ')}` });
        }

        const results = { created: 0, skipped: 0, errors: [] as string[] };
        const EmployeeService = (await import('../services/EmployeeService')).default;

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

            try {
                if (!row.name?.trim() || !row.email?.trim()) {
                    results.errors.push(`Row ${rowNum}: Missing name or email`);
                    results.skipped++;
                    continue;
                }

                await EmployeeService.createEmployee({
                    name: row.name.trim(),
                    email: row.email.trim(),
                    role: row.role?.trim() || 'Employee',
                    department: row.department?.trim() || 'General',
                    joinDate: row.joinDate?.trim() || row.join_date?.trim() || new Date().toISOString().split('T')[0],
                    salary: row.salary ? parseFloat(row.salary) : undefined,
                });
                results.created++;
            } catch (error: any) {
                const msg = error.message || 'Unknown error';
                if (msg.includes('already exists')) {
                    results.errors.push(`Row ${rowNum}: ${row.email} already exists`);
                } else {
                    results.errors.push(`Row ${rowNum}: ${msg}`);
                }
                results.skipped++;
            }
        }

        res.json({
            success: true,
            message: `Import complete: ${results.created} created, ${results.skipped} skipped`,
            ...results,
        });
    } catch (error: any) {
        console.error('CSV import error:', error);
        res.status(500).json({ error: error.message || 'Failed to import CSV' });
    }
});

// GET /api/employees/csv-template - Download CSV template
router.get('/csv-template', authenticateToken, (_req, res) => {
    const template = 'name,email,role,department,joinDate,salary\nJohn Doe,john@example.com,Software Engineer,Engineering,2024-01-15,50000\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employee-import-template.csv"');
    res.send(template);
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
