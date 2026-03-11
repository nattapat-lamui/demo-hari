import cron from 'node-cron';
import { query } from '../db';
import { getIO } from '../socket';

/**
 * Auto-checkout: runs at 23:59 Bangkok time daily.
 * Finds open attendance records (clock_in set, clock_out NULL) for today
 * and auto-closes them at 23:59.
 */
async function autoCheckout(): Promise<void> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

  try {
    // Find ALL open records up to today (catches missed days too)
    const openRecords = await query(
      `SELECT id, date, clock_in, break_duration, notes FROM attendance_records
       WHERE date <= $1 AND clock_in IS NOT NULL AND clock_out IS NULL`,
      [today]
    );

    if (openRecords.rows.length === 0) return;

    for (const row of openRecords.rows) {
      // Use the record's own date for checkout time (not today)
      const recordDate = new Date(row.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
      const checkoutTime = new Date(`${recordDate}T23:59:00+07:00`);

      const clockIn = new Date(row.clock_in);
      const breakDuration = row.break_duration || 0;
      const totalMinutes = (checkoutTime.getTime() - clockIn.getTime()) / 1000 / 60 - breakDuration;
      const totalHours = Math.round(totalMinutes / 60 * 100) / 100;
      // Auto-checkout: no overtime (OT only counts for manual checkout) and no early departure (23:59 is always after work_end)
      const overtimeHours = 0;
      const earlyDeparture = false;
      const existingNotes = row.notes ? `${row.notes} | ` : '';
      const notes = `${existingNotes}Auto-checkout: ไม่ได้เช็คเอาท์`;

      await query(
        `UPDATE attendance_records
         SET clock_out = $1, total_hours = $2, overtime_hours = $3,
             early_departure = $4, auto_checkout = TRUE, notes = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [checkoutTime, totalHours, overtimeHours, earlyDeparture, notes, row.id]
      );
    }

    console.log(`[AttendanceScheduler] Auto-checkout: ${openRecords.rows.length} record(s) closed`);

    // Emit socket event for real-time refresh
    try {
      const io = getIO();
      io.emit('attendance:updated', { type: 'auto-checkout' });
    } catch {
      // Socket may not be initialized in test environments
    }
  } catch (err) {
    console.error('[AttendanceScheduler] Auto-checkout error:', err);
  }
}

/**
 * Auto-mark absent: runs at 00:05 Bangkok time daily.
 * Looks at the PREVIOUS day and inserts Absent records for active employees
 * who have no attendance record and no approved leave. Skips weekends.
 */
async function autoMarkAbsent(): Promise<void> {
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
    const result = await query(
      `INSERT INTO attendance_records (employee_id, date, status, notes)
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
         )`,
      [prevDate]
    );

    const count = result.rowCount || 0;
    if (count > 0) {
      console.log(`[AttendanceScheduler] Auto-absent: ${count} record(s) created for ${prevDate}`);

      try {
        const io = getIO();
        io.emit('attendance:updated', { type: 'auto-absent' });
      } catch {
        // Socket may not be initialized in test environments
      }
    }
  } catch (err) {
    console.error('[AttendanceScheduler] Auto-absent error:', err);
  }
}

/**
 * Initialize the attendance cron jobs.
 * Call this after the server starts listening.
 */
export function initAttendanceScheduler(): void {
  // Auto-checkout at 23:59 Bangkok time
  cron.schedule('59 23 * * *', autoCheckout, {
    timezone: 'Asia/Bangkok',
  });

  // Auto-mark absent at 00:05 Bangkok time
  cron.schedule('5 0 * * *', autoMarkAbsent, {
    timezone: 'Asia/Bangkok',
  });

  console.log('[AttendanceScheduler] Attendance scheduler initialized');
}
