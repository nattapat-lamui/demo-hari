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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const db_1 = require("../db");
class AttendanceService {
    /**
     * Clock in for an employee
     */
    clockIn(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId, notes } = data;
            // Current moment in correct UTC
            const now = new Date();
            // Today's date in Bangkok timezone (YYYY-MM-DD) for the DB date column
            const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            // Check if already clocked in today
            const existing = yield (0, db_1.query)('SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2', [employeeId, today]);
            if (existing.rows.length > 0 && existing.rows[0].clock_in) {
                throw new Error('Already clocked in for today');
            }
            // Determine if late (after 9:00 AM Bangkok = 02:00 AM UTC)
            const lateThreshold = new Date(`${today}T09:00:00+07:00`);
            const status = now > lateThreshold ? 'Late' : 'On-time';
            if (existing.rows.length > 0) {
                // Update existing record
                const result = yield (0, db_1.query)(`UPDATE attendance_records
         SET clock_in = $1, status = $2, notes = COALESCE($3, notes), updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`, [now, status, notes, existing.rows[0].id]);
                return this.mapRowToAttendance(result.rows[0]);
            }
            // Create new record
            const result = yield (0, db_1.query)(`INSERT INTO attendance_records (employee_id, date, clock_in, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [employeeId, today, now, status, notes]);
            return this.mapRowToAttendance(result.rows[0]);
        });
    }
    /**
     * Clock out for an employee
     */
    clockOut(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId, notes } = data;
            // Current moment in correct UTC
            const now = new Date();
            // Today's date in Bangkok timezone (YYYY-MM-DD) for the DB date column
            const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            // Find today's attendance record
            const existing = yield (0, db_1.query)('SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2', [employeeId, today]);
            if (existing.rows.length === 0 || !existing.rows[0].clock_in) {
                throw new Error('Must clock in before clocking out');
            }
            if (existing.rows[0].clock_out) {
                throw new Error('Already clocked out for today');
            }
            const clockIn = new Date(existing.rows[0].clock_in);
            const breakDuration = existing.rows[0].break_duration || 0;
            const totalMinutes = (now.getTime() - clockIn.getTime()) / 1000 / 60 - breakDuration;
            const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
            const status = existing.rows[0].status;
            const result = yield (0, db_1.query)(`UPDATE attendance_records
       SET clock_out = $1, total_hours = $2, status = $3, notes = COALESCE($4, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`, [now, totalHours, status, notes, existing.rows[0].id]);
            return this.mapRowToAttendance(result.rows[0]);
        });
    }
    /**
     * Get attendance for an employee by date range
     */
    getAttendanceByEmployee(employeeId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            let queryText = 'SELECT * FROM attendance_records WHERE employee_id = $1';
            const params = [employeeId];
            let paramIndex = 2;
            if (startDate) {
                queryText += ` AND date >= $${paramIndex++}`;
                params.push(startDate);
            }
            if (endDate) {
                queryText += ` AND date <= $${paramIndex++}`;
                params.push(endDate);
            }
            queryText += ' ORDER BY date DESC';
            const result = yield (0, db_1.query)(queryText, params);
            return result.rows.map(this.mapRowToAttendance);
        });
    }
    /**
     * Get today's attendance status for an employee
     */
    getTodayStatus(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Today's date in Bangkok timezone
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            const result = yield (0, db_1.query)('SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2', [employeeId, today]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToAttendance(result.rows[0]);
        });
    }
    /**
     * Get attendance summary for a date range
     */
    getAttendanceSummary(employeeId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE status = 'On-time') as present_days,
        COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'Late') as late_days,
        COUNT(*) FILTER (WHERE status = 'On-leave') as on_leave_days,
        COALESCE(SUM(total_hours), 0) as total_hours
       FROM attendance_records
       WHERE employee_id = $1 AND date BETWEEN $2 AND $3`, [employeeId, startDate, endDate]);
            const row = result.rows[0];
            return {
                totalDays: parseInt(row.total_days, 10),
                presentDays: parseInt(row.present_days, 10),
                absentDays: parseInt(row.absent_days, 10),
                lateDays: parseInt(row.late_days, 10),
                onLeaveDays: parseInt(row.on_leave_days, 10),
                totalHours: parseFloat(row.total_hours),
            };
        });
    }
    // ===========================================================================
    // Admin Methods
    // ===========================================================================
    /**
     * Get today's attendance snapshot counts for admin dashboard
     */
    adminGetTodaySnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            // Today's date in Bangkok timezone
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            const result = yield (0, db_1.query)(`SELECT
        COUNT(*) FILTER (WHERE status = 'On-time') AS present,
        COUNT(*) FILTER (WHERE status = 'Late') AS late,
        COUNT(*) FILTER (WHERE status = 'Absent') AS absent,
        COUNT(*) FILTER (WHERE status = 'On-leave') AS on_leave_records,
        (SELECT COUNT(DISTINCT lr.employee_id)
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id AND e.status = 'Active'
         WHERE lr.status = 'Approved' AND $1::date BETWEEN lr.start_date AND lr.end_date) AS on_leave_requests,
        (SELECT COUNT(*) FROM employees WHERE status = 'Active') AS total
       FROM attendance_records
       WHERE date = $1`, [today]);
            const row = result.rows[0];
            const onLeaveRecords = parseInt(row.on_leave_records, 10);
            const onLeaveRequests = parseInt(row.on_leave_requests, 10);
            return {
                present: parseInt(row.present, 10),
                late: parseInt(row.late, 10),
                absent: parseInt(row.absent, 10),
                onLeave: Math.max(onLeaveRecords, onLeaveRequests),
                total: parseInt(row.total, 10),
            };
        });
    }
    /**
     * Get paginated attendance records with employee details for admin view
     */
    adminGetAllAttendance(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, department, status, startDate, endDate, page = 1, limit = 20 } = filters;
            const conditions = [];
            const params = [];
            let paramIndex = 1;
            if (search) {
                conditions.push(`e.name ILIKE $${paramIndex++}`);
                params.push(`%${search}%`);
            }
            if (department && department !== 'All') {
                conditions.push(`e.department = $${paramIndex++}`);
                params.push(department);
            }
            if (status && status !== 'All') {
                conditions.push(`ar.status = $${paramIndex++}`);
                params.push(status);
            }
            if (startDate) {
                conditions.push(`ar.date >= $${paramIndex++}`);
                params.push(startDate);
            }
            if (endDate) {
                conditions.push(`ar.date <= $${paramIndex++}`);
                params.push(endDate);
            }
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            // Count total
            const countResult = yield (0, db_1.query)(`SELECT COUNT(*) AS total
       FROM attendance_records ar
       JOIN employees e ON ar.employee_id = e.id
       ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].total, 10);
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            // Fetch paginated records
            const dataResult = yield (0, db_1.query)(`SELECT ar.*, e.name AS employee_name, e.department AS employee_department, e.avatar AS employee_avatar
       FROM attendance_records ar
       JOIN employees e ON ar.employee_id = e.id
       ${whereClause}
       ORDER BY ar.date DESC, e.name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset]);
            const data = dataResult.rows.map((row) => (Object.assign(Object.assign({}, this.mapRowToAttendance(row)), { employeeName: row.employee_name, employeeDepartment: row.employee_department, employeeAvatar: row.employee_avatar })));
            return { data, total, page, limit, totalPages };
        });
    }
    /**
     * Upsert an attendance record (admin manual entry)
     * Bypasses late-threshold and double-clock-in checks
     */
    adminUpsertAttendance(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId, date, clockIn, clockOut, status, notes, modifiedBy } = data;
            // Auto-compute totalHours when both clock in and out are provided
            let totalHours = null;
            if (clockIn && clockOut) {
                const inTime = new Date(clockIn).getTime();
                const outTime = new Date(clockOut).getTime();
                if (outTime > inTime) {
                    totalHours = Math.round((outTime - inTime) / 1000 / 60 / 60 * 100) / 100;
                }
            }
            const result = yield (0, db_1.query)(`INSERT INTO attendance_records (employee_id, date, clock_in, clock_out, total_hours, status, notes, modified_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET
         clock_in = COALESCE($3, attendance_records.clock_in),
         clock_out = COALESCE($4, attendance_records.clock_out),
         total_hours = COALESCE($5, attendance_records.total_hours),
         status = COALESCE($6, attendance_records.status),
         notes = COALESCE($7, attendance_records.notes),
         modified_by = $8,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [employeeId, date, clockIn || null, clockOut || null, totalHours, status || 'On-time', notes || null, modifiedBy]);
            return this.mapRowToAttendance(result.rows[0]);
        });
    }
    /**
     * Delete an attendance record by ID
     */
    adminDeleteAttendance(recordId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)('DELETE FROM attendance_records WHERE id = $1', [recordId]);
            if (result.rowCount === 0) {
                throw new Error('Attendance record not found');
            }
        });
    }
    mapRowToAttendance(row) {
        return {
            id: row.id,
            employeeId: row.employee_id,
            date: row.date,
            clockIn: row.clock_in,
            clockOut: row.clock_out,
            breakDuration: row.break_duration,
            totalHours: row.total_hours,
            status: row.status,
            notes: row.notes,
            modifiedBy: row.modified_by,
            createdAt: row.created_at,
        };
    }
}
exports.AttendanceService = AttendanceService;
exports.default = new AttendanceService();
