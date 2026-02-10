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
const auth_1 = require("../middlewares/auth");
const AttendanceService_1 = __importDefault(require("../services/AttendanceService"));
const router = (0, express_1.Router)();
// All admin attendance routes require authentication + admin role
router.use(auth_1.authenticateToken, auth_1.requireAdmin);
/**
 * GET /api/admin/attendance/snapshot
 * Get today's attendance snapshot (present/late/absent/remote/halfDay/total)
 */
router.get('/snapshot', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield AttendanceService_1.default.adminGetTodaySnapshot();
        res.json(snapshot);
    }
    catch (error) {
        console.error('Error getting attendance snapshot:', error);
        res.status(500).json({ error: 'Failed to get attendance snapshot' });
    }
}));
/**
 * GET /api/admin/attendance/records
 * Get paginated attendance records with filters
 * Query params: search, department, status, startDate, endDate, page, limit
 */
router.get('/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, department, status, startDate, endDate, page, limit } = req.query;
        const result = yield AttendanceService_1.default.adminGetAllAttendance({
            search: search,
            department: department,
            status: status,
            startDate: startDate,
            endDate: endDate,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error getting admin attendance records:', error);
        res.status(500).json({ error: 'Failed to get attendance records' });
    }
}));
/**
 * PUT /api/admin/attendance/records
 * Upsert (create or update) an attendance record
 * Body: { employeeId, date, clockIn?, clockOut?, status?, notes? }
 */
router.put('/records', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId, date, clockIn, clockOut, status, notes } = req.body;
        if (!employeeId || !date) {
            return res.status(400).json({ error: 'employeeId and date are required' });
        }
        const record = yield AttendanceService_1.default.adminUpsertAttendance({
            employeeId,
            date,
            clockIn,
            clockOut,
            status,
            notes,
            modifiedBy: req.user.userId,
        });
        res.json(record);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to upsert attendance record';
        console.error('Error upserting attendance:', error);
        res.status(400).json({ error: message });
    }
}));
/**
 * DELETE /api/admin/attendance/records/:id
 * Delete an attendance record
 */
router.delete('/records/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield AttendanceService_1.default.adminDeleteAttendance(req.params.id);
        res.json({ message: 'Attendance record deleted' });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete attendance record';
        console.error('Error deleting attendance:', error);
        res.status(400).json({ error: message });
    }
}));
exports.default = router;
