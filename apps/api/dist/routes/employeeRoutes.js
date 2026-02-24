"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeeController_1 = __importDefault(require("../controllers/EmployeeController"));
const EmployeeLeaveQuotaController_1 = __importDefault(require("../controllers/EmployeeLeaveQuotaController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const cache_1 = require("../middlewares/cache");
const upload_1 = require("../middlewares/upload");
const StorageService_1 = require("../services/StorageService");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// POST /api/employees/upload-avatar - Upload avatar image
router.post('/upload-avatar', security_1.apiLimiter, upload_1.avatarUpload.single('avatar'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const key = (0, upload_1.generateStorageKey)('avatars', req.file, 'avatar');
        const buffer = (0, upload_1.getFileBuffer)(req.file);
        yield StorageService_1.storageService.upload({ key, body: buffer, contentType: req.file.mimetype });
        // For avatars: return public URL (R2) or relative path (local)
        const avatarUrl = StorageService_1.storageService.getPublicUrl(key) || `/uploads/${key}`;
        res.status(200).json({
            success: true,
            avatarUrl,
            message: 'Avatar uploaded successfully'
        });
    }
    catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
}));
// GET /api/employees - Get all employees (any authenticated user) - cached for 30s
router.get('/', (0, cache_1.cacheMiddleware)(), EmployeeController_1.default.getAllEmployees.bind(EmployeeController_1.default));
// GET /api/employees/:id/leave-quotas - Get effective leave quotas for employee
router.get('/:id/leave-quotas', EmployeeLeaveQuotaController_1.default.getEffectiveQuotas.bind(EmployeeLeaveQuotaController_1.default));
// PUT /api/employees/:id/leave-quotas - Upsert leave quota overrides (Admin only)
router.put('/:id/leave-quotas', auth_1.requireAdmin, security_1.apiLimiter, EmployeeLeaveQuotaController_1.default.upsertOverrides.bind(EmployeeLeaveQuotaController_1.default));
// DELETE /api/employees/:id/leave-quotas/:type - Delete a single leave quota override (Admin only)
router.delete('/:id/leave-quotas/:type', auth_1.requireAdmin, security_1.apiLimiter, EmployeeLeaveQuotaController_1.default.deleteOverride.bind(EmployeeLeaveQuotaController_1.default));
// GET /api/employees/:id/manager - Get employee's manager (any authenticated user) - cached for 30s
router.get('/:id/manager', (0, cache_1.cacheMiddleware)(), EmployeeController_1.default.getEmployeeManager.bind(EmployeeController_1.default));
// GET /api/employees/:id/direct-reports - Get employee's direct reports (any authenticated user) - cached for 30s
router.get('/:id/direct-reports', (0, cache_1.cacheMiddleware)(), EmployeeController_1.default.getEmployeeDirectReports.bind(EmployeeController_1.default));
// GET /api/employees/:id - Get employee by ID (any authenticated user) - cached for 30s
router.get('/:id', (0, cache_1.cacheMiddleware)(), EmployeeController_1.default.getEmployeeById.bind(EmployeeController_1.default));
// POST /api/employees - Create new employee (HR_ADMIN only)
router.post('/', auth_1.requireAdmin, security_1.apiLimiter, security_1.validateEmployeeCreation, security_1.validateRequest, (0, cache_1.invalidateCache)('/api/employees'), EmployeeController_1.default.createEmployee.bind(EmployeeController_1.default));
// PATCH /api/employees/:id - Update own profile (any authenticated user) or any employee (HR_ADMIN)
router.patch('/:id', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/employees'), EmployeeController_1.default.updateEmployee.bind(EmployeeController_1.default));
// PUT /api/employees/:id - Update employee (HR_ADMIN only)
router.put('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/employees'), EmployeeController_1.default.updateEmployee.bind(EmployeeController_1.default));
// DELETE /api/employees/:id - Delete employee (HR_ADMIN only)
router.delete('/:id', auth_1.requireAdmin, security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/employees'), EmployeeController_1.default.deleteEmployee.bind(EmployeeController_1.default));
exports.default = router;
