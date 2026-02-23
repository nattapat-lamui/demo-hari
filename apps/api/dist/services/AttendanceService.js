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
const CONFIG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let configCache = null;
function getWorkSchedule() {
    return __awaiter(this, void 0, void 0, function* () {
        if (configCache && Date.now() - configCache.fetchedAt < CONFIG_CACHE_TTL) {
            return configCache.data;
        }
        const result = yield (0, db_1.query)(`SELECT key, value FROM system_configs WHERE category = 'attendance'`);
        const map = {};
        for (const row of result.rows) {
            map[row.key] = row.value;
        }
        const data = {
            lateThreshold: map['late_threshold'] || '09:00',
            workEnd: map['work_end'] || '18:00',
            standardHours: parseFloat(map['standard_hours'] || '8'),
        };
        configCache = { data, fetchedAt: Date.now() };
        return data;
    });
}
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
            // Determine if late using configurable threshold
            const config = yield getWorkSchedule();
            const lateThreshold = new Date(`${today}T${config.lateThreshold}:00+07:00`);
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
            // Compute overtime and early departure
            const config = yield getWorkSchedule();
            const overtimeHours = Math.max(0, Math.round((totalHours - config.standardHours) * 100) / 100);
            const workEndTime = new Date(`${today}T${config.workEnd}:00+07:00`);
            const earlyDeparture = now < workEndTime;
            const status = existing.rows[0].status;
            const result = yield (0, db_1.query)(`UPDATE attendance_records
       SET clock_out = $1, total_hours = $2, status = $3, notes = COALESCE($4, notes),
           overtime_hours = $5, early_departure = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`, [now, totalHours, status, notes, overtimeHours, earlyDeparture, existing.rows[0].id]);
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
        COALESCE(SUM(total_hours), 0) as total_hours,
        COALESCE(SUM(overtime_hours), 0) as overtime_hours
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
                overtimeHours: parseFloat(row.overtime_hours),
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
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL) AS present_today,
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NULL) AS active_now,
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NOT NULL) AS checked_out,
        (SELECT COUNT(DISTINCT lr.employee_id)
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id AND e.status = 'Active'
         WHERE lr.status = 'Approved' AND $1::date BETWEEN lr.start_date AND lr.end_date) AS on_leave,
        (SELECT COUNT(*) FROM employees WHERE status = 'Active') AS total
       FROM attendance_records
       WHERE date = $1`, [today]);
            const row = result.rows[0];
            const total = parseInt(row.total, 10);
            const presentToday = parseInt(row.present_today, 10);
            const onLeave = parseInt(row.on_leave, 10);
            return {
                total,
                presentToday,
                activeNow: parseInt(row.active_now, 10),
                checkedOut: parseInt(row.checked_out, 10),
                absentOrLeave: Math.max(0, total - presentToday),
                onLeave,
            };
        });
    }
    /**
     * Get paginated attendance for ALL active employees (including those with no record).
     * Uses LEFT JOIN so every employee appears; displayStatus is computed from clock data + leave requests.
     */
    adminGetAllAttendance(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const { search, department, status, startDate, endDate, page = 1, limit = 20 } = filters;
            // $1 = target date used in the LEFT JOINs
            const targetDate = startDate || endDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
            const conditions = ["e.status = 'Active'"];
            const params = [targetDate];
            let paramIndex = 2;
            if (search) {
                conditions.push(`e.name ILIKE $${paramIndex++}`);
                params.push(`%${search}%`);
            }
            if (department && department !== 'All') {
                conditions.push(`e.department = $${paramIndex++}`);
                params.push(department);
            }
            // Map display-status filter values to SQL conditions
            if (status && status !== 'All') {
                switch (status) {
                    case 'Present':
                        conditions.push('ar.clock_in IS NOT NULL');
                        break;
                    case 'Active':
                        conditions.push("ar.clock_in IS NOT NULL AND ar.clock_out IS NULL AND ar.status NOT IN ('On-leave','Absent')");
                        break;
                    case 'Checked Out':
                        conditions.push("ar.clock_in IS NOT NULL AND ar.clock_out IS NOT NULL AND ar.status NOT IN ('On-leave','Absent')");
                        break;
                    case 'On-Leave':
                        conditions.push("(ar.status = 'On-leave' OR (ar.id IS NULL AND lr.id IS NOT NULL))");
                        break;
                    case 'Absent':
                        conditions.push("((ar.id IS NULL AND lr.id IS NULL) OR (ar.id IS NOT NULL AND (ar.status = 'Absent' OR (ar.clock_in IS NULL AND ar.status != 'On-leave'))))");
                        break;
                    case 'Not In':
                        conditions.push("(ar.clock_in IS NULL OR ar.status = 'On-leave' OR (ar.id IS NULL AND lr.id IS NOT NULL))");
                        break;
                    default:
                        conditions.push(`ar.status = $${paramIndex++}`);
                        params.push(status);
                }
            }
            const whereClause = `WHERE ${conditions.join(' AND ')}`;
            const fromClause = `
      FROM employees e
      LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.date = $1
      LEFT JOIN LATERAL (
        SELECT lr2.id FROM leave_requests lr2
        WHERE lr2.employee_id = e.id AND lr2.status = 'Approved'
          AND $1::date BETWEEN lr2.start_date AND lr2.end_date
        LIMIT 1
      ) lr ON true`;
            // Count total
            const countResult = yield (0, db_1.query)(`SELECT COUNT(*) AS total ${fromClause} ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].total, 10);
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;
            // Fetch paginated records
            const dataResult = yield (0, db_1.query)(`SELECT
        ar.id AS ar_id, ar.date AS ar_date, ar.clock_in, ar.clock_out,
        ar.break_duration, ar.total_hours, ar.status AS ar_status,
        ar.notes, ar.modified_by, ar.created_at AS ar_created_at,
        ar.auto_checkout, ar.early_departure, ar.overtime_hours,
        e.id AS employee_id, e.name AS employee_name,
        e.department AS employee_department, e.avatar AS employee_avatar,
        CASE WHEN lr.id IS NOT NULL THEN true ELSE false END AS is_on_leave
      ${fromClause}
      ${whereClause}
      ORDER BY
        CASE
          WHEN ar.clock_in IS NOT NULL AND ar.clock_out IS NULL THEN 0
          WHEN ar.clock_in IS NOT NULL AND ar.clock_out IS NOT NULL THEN 1
          WHEN lr.id IS NOT NULL OR ar.status = 'On-leave' THEN 2
          ELSE 3
        END,
        e.name ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`, [...params, limit, offset]);
            const data = dataResult.rows.map((row) => {
                const hasRecord = row.ar_id != null;
                const isOnLeave = row.is_on_leave === true || (hasRecord && row.ar_status === 'On-leave');
                let displayStatus;
                if (hasRecord && row.ar_status === 'On-leave') {
                    displayStatus = 'On-Leave';
                }
                else if (hasRecord && row.clock_in && !row.clock_out) {
                    displayStatus = 'Active';
                }
                else if (hasRecord && row.clock_in && row.clock_out) {
                    displayStatus = 'Checked Out';
                }
                else if (isOnLeave) {
                    displayStatus = 'On-Leave';
                }
                else {
                    displayStatus = 'Not In';
                }
                return {
                    id: row.ar_id || `absent-${row.employee_id}`,
                    employeeId: row.employee_id,
                    date: row.ar_date || targetDate,
                    clockIn: row.clock_in,
                    clockOut: row.clock_out,
                    breakDuration: row.break_duration || 0,
                    totalHours: row.total_hours,
                    status: row.ar_status || (isOnLeave ? 'On-leave' : 'Absent'),
                    notes: row.notes,
                    modifiedBy: row.modified_by,
                    createdAt: row.ar_created_at || new Date(),
                    employeeName: row.employee_name,
                    employeeDepartment: row.employee_department,
                    employeeAvatar: row.employee_avatar,
                    displayStatus,
                    autoCheckout: row.auto_checkout === true,
                    earlyDeparture: row.early_departure === true,
                    overtimeHours: row.overtime_hours != null ? parseFloat(row.overtime_hours) : null,
                };
            });
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
            // Auto-compute totalHours, overtime, early departure when both clock times provided
            let totalHours = null;
            let overtimeHours = null;
            let earlyDeparture = false;
            if (clockIn && clockOut) {
                const inTime = new Date(clockIn).getTime();
                const outTime = new Date(clockOut).getTime();
                if (outTime > inTime) {
                    totalHours = Math.round((outTime - inTime) / 1000 / 60 / 60 * 100) / 100;
                    const config = yield getWorkSchedule();
                    overtimeHours = Math.max(0, Math.round((totalHours - config.standardHours) * 100) / 100);
                    const workEndTime = new Date(`${date}T${config.workEnd}:00+07:00`);
                    earlyDeparture = new Date(clockOut) < workEndTime;
                }
            }
            const result = yield (0, db_1.query)(`INSERT INTO attendance_records (employee_id, date, clock_in, clock_out, total_hours, status, notes, modified_by, overtime_hours, early_departure)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET
         clock_in = COALESCE($3, attendance_records.clock_in),
         clock_out = COALESCE($4, attendance_records.clock_out),
         total_hours = COALESCE($5, attendance_records.total_hours),
         status = COALESCE($6, attendance_records.status),
         notes = COALESCE($7, attendance_records.notes),
         modified_by = $8,
         overtime_hours = COALESCE($9, attendance_records.overtime_hours),
         early_departure = COALESCE($10, attendance_records.early_departure),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [employeeId, date, clockIn || null, clockOut || null, totalHours, status || 'On-time', notes || null, modifiedBy, overtimeHours, earlyDeparture]);
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
            autoCheckout: row.auto_checkout === true,
            earlyDeparture: row.early_departure === true,
            overtimeHours: row.overtime_hours != null ? parseFloat(row.overtime_hours) : null,
        };
    }
}
exports.AttendanceService = AttendanceService;
exports.default = new AttendanceService();
