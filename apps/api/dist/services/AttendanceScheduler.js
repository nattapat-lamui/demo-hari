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
exports.initAttendanceScheduler = initAttendanceScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db");
const socket_1 = require("../socket");
/**
 * Auto-checkout: runs at 23:59 Bangkok time daily.
 * Finds open attendance records (clock_in set, clock_out NULL) for today
 * and auto-closes them at 23:59.
 */
function autoCheckout() {
    return __awaiter(this, void 0, void 0, function* () {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
        const checkoutTime = new Date(`${today}T23:59:00+07:00`);
        try {
            // Get work schedule config for overtime calc
            const configResult = yield (0, db_1.query)(`SELECT key, value FROM system_configs WHERE category = 'attendance'`);
            const configMap = {};
            for (const row of configResult.rows) {
                configMap[row.key] = row.value;
            }
            const standardHours = parseFloat(configMap['standard_hours'] || '8');
            const workEnd = configMap['work_end'] || '18:00';
            // Find open records for today
            const openRecords = yield (0, db_1.query)(`SELECT id, clock_in, break_duration, notes FROM attendance_records
       WHERE date = $1 AND clock_in IS NOT NULL AND clock_out IS NULL`, [today]);
            if (openRecords.rows.length === 0)
                return;
            const workEndTime = new Date(`${today}T${workEnd}:00+07:00`);
            for (const row of openRecords.rows) {
                const clockIn = new Date(row.clock_in);
                const breakDuration = row.break_duration || 0;
                const totalMinutes = (checkoutTime.getTime() - clockIn.getTime()) / 1000 / 60 - breakDuration;
                const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
                const overtimeHours = Math.max(0, Math.round((totalHours - standardHours) * 100) / 100);
                const earlyDeparture = checkoutTime < workEndTime;
                const existingNotes = row.notes ? `${row.notes} | ` : '';
                const notes = `${existingNotes}Auto-checkout: ไม่ได้เช็คเอาท์`;
                yield (0, db_1.query)(`UPDATE attendance_records
         SET clock_out = $1, total_hours = $2, overtime_hours = $3,
             early_departure = $4, auto_checkout = TRUE, notes = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`, [checkoutTime, totalHours, overtimeHours, earlyDeparture, notes, row.id]);
            }
            console.log(`[AttendanceScheduler] Auto-checkout: ${openRecords.rows.length} record(s) closed`);
            // Emit socket event for real-time refresh
            try {
                const io = (0, socket_1.getIO)();
                io.emit('attendance:updated', { type: 'auto-checkout' });
            }
            catch (_a) {
                // Socket may not be initialized in test environments
            }
        }
        catch (err) {
            console.error('[AttendanceScheduler] Auto-checkout error:', err);
        }
    });
}
/**
 * Auto-mark absent: runs at 00:05 Bangkok time daily.
 * Looks at the PREVIOUS day and inserts Absent records for active employees
 * who have no attendance record and no approved leave. Skips weekends.
 */
function autoMarkAbsent() {
    return __awaiter(this, void 0, void 0, function* () {
        // Previous day in Bangkok timezone
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const prevDate = yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
        // Skip weekends (Sat=6, Sun=0)
        const dayOfWeek = new Date(`${prevDate}T12:00:00+07:00`).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log(`[AttendanceScheduler] Auto-absent: skipping weekend (${prevDate})`);
            return;
        }
        try {
            // Insert Absent records for active employees with no attendance record and no approved leave
            const result = yield (0, db_1.query)(`INSERT INTO attendance_records (employee_id, date, status, notes)
       SELECT e.id, $1, 'Absent', 'Auto-marked absent'
       FROM employees e
       WHERE e.status = 'Active'
         AND NOT EXISTS (
           SELECT 1 FROM attendance_records ar
           WHERE ar.employee_id = e.id AND ar.date = $1
         )
         AND NOT EXISTS (
           SELECT 1 FROM leave_requests lr
           WHERE lr.employee_id = e.id AND lr.status = 'Approved'
             AND $1::date BETWEEN lr.start_date AND lr.end_date
         )`, [prevDate]);
            const count = result.rowCount || 0;
            if (count > 0) {
                console.log(`[AttendanceScheduler] Auto-absent: ${count} record(s) created for ${prevDate}`);
                try {
                    const io = (0, socket_1.getIO)();
                    io.emit('attendance:updated', { type: 'auto-absent' });
                }
                catch (_a) {
                    // Socket may not be initialized in test environments
                }
            }
        }
        catch (err) {
            console.error('[AttendanceScheduler] Auto-absent error:', err);
        }
    });
}
/**
 * Initialize the attendance cron jobs.
 * Call this after the server starts listening.
 */
function initAttendanceScheduler() {
    // Auto-checkout at 23:59 Bangkok time
    node_cron_1.default.schedule('59 23 * * *', autoCheckout, {
        timezone: 'Asia/Bangkok',
    });
    // Auto-mark absent at 00:05 Bangkok time
    node_cron_1.default.schedule('5 0 * * *', autoMarkAbsent, {
        timezone: 'Asia/Bangkok',
    });
    console.log('[AttendanceScheduler] Attendance scheduler initialized');
}
