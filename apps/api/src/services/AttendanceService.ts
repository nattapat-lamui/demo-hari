import { query } from '../db';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakDuration: number;
  totalHours: number | null;
  status: 'On-time' | 'Late' | 'Absent' | 'On-leave';
  notes: string | null;
  modifiedBy: string | null;
  createdAt: Date;
}

export interface AdminAttendanceFilters {
  search?: string;
  department?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export type AdminDisplayStatus = 'Active' | 'Checked Out' | 'On-Leave' | 'Not In' | 'Absent';

export interface AdminAttendanceRecord extends AttendanceRecord {
  employeeName: string;
  employeeDepartment: string;
  employeeAvatar: string | null;
  displayStatus?: AdminDisplayStatus;
}

export interface AttendanceSnapshot {
  total: number;
  presentToday: number;
  activeNow: number;
  checkedOut: number;
  absentOrLeave: number;
  onLeave: number;
}

export interface AdminUpsertData {
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status?: AttendanceRecord['status'];
  notes?: string;
  modifiedBy: string;
}

export interface ClockInData {
  employeeId: string;
  notes?: string;
}

export interface ClockOutData {
  employeeId: string;
  notes?: string;
}

export class AttendanceService {
  /**
   * Clock in for an employee
   */
  async clockIn(data: ClockInData): Promise<AttendanceRecord> {
    const { employeeId, notes } = data;

    // Current moment in correct UTC
    const now = new Date();
    // Today's date in Bangkok timezone (YYYY-MM-DD) for the DB date column
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    // Check if already clocked in today
    const existing = await query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].clock_in) {
      throw new Error('Already clocked in for today');
    }

    // Determine if late (after 9:00 AM Bangkok = 02:00 AM UTC)
    const lateThreshold = new Date(`${today}T09:00:00+07:00`);
    const status = now > lateThreshold ? 'Late' : 'On-time';

    if (existing.rows.length > 0) {
      // Update existing record
      const result = await query(
        `UPDATE attendance_records
         SET clock_in = $1, status = $2, notes = COALESCE($3, notes), updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [now, status, notes, existing.rows[0].id]
      );
      return this.mapRowToAttendance(result.rows[0]);
    }

    // Create new record
    const result = await query(
      `INSERT INTO attendance_records (employee_id, date, clock_in, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, today, now, status, notes]
    );

    return this.mapRowToAttendance(result.rows[0]);
  }

  /**
   * Clock out for an employee
   */
  async clockOut(data: ClockOutData): Promise<AttendanceRecord> {
    const { employeeId, notes } = data;

    // Current moment in correct UTC
    const now = new Date();
    // Today's date in Bangkok timezone (YYYY-MM-DD) for the DB date column
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    // Find today's attendance record
    const existing = await query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );

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

    const result = await query(
      `UPDATE attendance_records
       SET clock_out = $1, total_hours = $2, status = $3, notes = COALESCE($4, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [now, totalHours, status, notes, existing.rows[0].id]
    );

    return this.mapRowToAttendance(result.rows[0]);
  }

  /**
   * Get attendance for an employee by date range
   */
  async getAttendanceByEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    let queryText = 'SELECT * FROM attendance_records WHERE employee_id = $1';
    const params: unknown[] = [employeeId];
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

    const result = await query(queryText, params);
    return result.rows.map(this.mapRowToAttendance);
  }

  /**
   * Get today's attendance status for an employee
   */
  async getTodayStatus(employeeId: string): Promise<AttendanceRecord | null> {
    // Today's date in Bangkok timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    const result = await query(
      'SELECT * FROM attendance_records WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAttendance(result.rows[0]);
  }

  /**
   * Get attendance summary for a date range
   */
  async getAttendanceSummary(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    onLeaveDays: number;
    totalHours: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE status = 'On-time') as present_days,
        COUNT(*) FILTER (WHERE status = 'Absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'Late') as late_days,
        COUNT(*) FILTER (WHERE status = 'On-leave') as on_leave_days,
        COALESCE(SUM(total_hours), 0) as total_hours
       FROM attendance_records
       WHERE employee_id = $1 AND date BETWEEN $2 AND $3`,
      [employeeId, startDate, endDate]
    );

    const row = result.rows[0];
    return {
      totalDays: parseInt(row.total_days, 10),
      presentDays: parseInt(row.present_days, 10),
      absentDays: parseInt(row.absent_days, 10),
      lateDays: parseInt(row.late_days, 10),
      onLeaveDays: parseInt(row.on_leave_days, 10),
      totalHours: parseFloat(row.total_hours),
    };
  }

  // ===========================================================================
  // Admin Methods
  // ===========================================================================

  /**
   * Get today's attendance snapshot counts for admin dashboard
   */
  async adminGetTodaySnapshot(): Promise<AttendanceSnapshot> {
    // Today's date in Bangkok timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL) AS present_today,
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NULL) AS active_now,
        COUNT(*) FILTER (WHERE clock_in IS NOT NULL AND clock_out IS NOT NULL) AS checked_out,
        (SELECT COUNT(DISTINCT lr.employee_id)
         FROM leave_requests lr
         JOIN employees e ON lr.employee_id = e.id AND e.status = 'Active'
         WHERE lr.status = 'Approved' AND $1::date BETWEEN lr.start_date AND lr.end_date) AS on_leave,
        (SELECT COUNT(*) FROM employees WHERE status = 'Active') AS total
       FROM attendance_records
       WHERE date = $1`,
      [today]
    );

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
  }

  /**
   * Get paginated attendance for ALL active employees (including those with no record).
   * Uses LEFT JOIN so every employee appears; displayStatus is computed from clock data + leave requests.
   */
  async adminGetAllAttendance(filters: AdminAttendanceFilters): Promise<{
    data: AdminAttendanceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, department, status, startDate, endDate, page = 1, limit = 20 } = filters;

    // $1 = target date used in the LEFT JOINs
    const targetDate = startDate || endDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

    const conditions: string[] = ["e.status = 'Active'"];
    const params: unknown[] = [targetDate];
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
        case 'Absent / On-Leave':
          conditions.push('ar.clock_in IS NULL');
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
    const countResult = await query(
      `SELECT COUNT(*) AS total ${fromClause} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch paginated records
    const dataResult = await query(
      `SELECT
        ar.id AS ar_id, ar.date AS ar_date, ar.clock_in, ar.clock_out,
        ar.break_duration, ar.total_hours, ar.status AS ar_status,
        ar.notes, ar.modified_by, ar.created_at AS ar_created_at,
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
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    // Determine whether "no check-in" means "Not In" (still early) or "Absent" (past noon)
    const now = new Date();
    const todayBangkok = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    const isTargetToday = targetDate === todayBangkok;
    const bangkokHour = isTargetToday
      ? parseInt(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false }))
      : 24; // past date → always counts as "Absent"
    const notInStatus: AdminDisplayStatus = bangkokHour < 12 ? 'Not In' : 'Absent';

    const data = dataResult.rows.map((row: Record<string, unknown>): AdminAttendanceRecord => {
      const hasRecord = row.ar_id != null;
      const isOnLeave = row.is_on_leave === true || (hasRecord && row.ar_status === 'On-leave');

      let displayStatus: AdminDisplayStatus;
      if (hasRecord && row.ar_status === 'On-leave') {
        displayStatus = 'On-Leave';
      } else if (hasRecord && row.ar_status === 'Absent') {
        displayStatus = notInStatus;
      } else if (hasRecord && row.clock_in && !row.clock_out) {
        displayStatus = 'Active';
      } else if (hasRecord && row.clock_in && row.clock_out) {
        displayStatus = 'Checked Out';
      } else if (isOnLeave) {
        displayStatus = 'On-Leave';
      } else {
        displayStatus = notInStatus;
      }

      return {
        id: (row.ar_id as string) || `absent-${row.employee_id}`,
        employeeId: row.employee_id as string,
        date: (row.ar_date as string) || targetDate,
        clockIn: row.clock_in as string | null,
        clockOut: row.clock_out as string | null,
        breakDuration: (row.break_duration as number) || 0,
        totalHours: row.total_hours as number | null,
        status: (row.ar_status as AttendanceRecord['status']) || (isOnLeave ? 'On-leave' : 'Absent'),
        notes: row.notes as string | null,
        modifiedBy: row.modified_by as string | null,
        createdAt: (row.ar_created_at as Date) || new Date(),
        employeeName: row.employee_name as string,
        employeeDepartment: row.employee_department as string,
        employeeAvatar: row.employee_avatar as string | null,
        displayStatus,
      };
    });

    return { data, total, page, limit, totalPages };
  }

  /**
   * Upsert an attendance record (admin manual entry)
   * Bypasses late-threshold and double-clock-in checks
   */
  async adminUpsertAttendance(data: AdminUpsertData): Promise<AttendanceRecord> {
    const { employeeId, date, clockIn, clockOut, status, notes, modifiedBy } = data;

    // Auto-compute totalHours when both clock in and out are provided
    let totalHours: number | null = null;
    if (clockIn && clockOut) {
      const inTime = new Date(clockIn).getTime();
      const outTime = new Date(clockOut).getTime();
      if (outTime > inTime) {
        totalHours = Math.round((outTime - inTime) / 1000 / 60 / 60 * 100) / 100;
      }
    }

    const result = await query(
      `INSERT INTO attendance_records (employee_id, date, clock_in, clock_out, total_hours, status, notes, modified_by)
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
       RETURNING *`,
      [employeeId, date, clockIn || null, clockOut || null, totalHours, status || 'On-time', notes || null, modifiedBy]
    );

    return this.mapRowToAttendance(result.rows[0]);
  }

  /**
   * Delete an attendance record by ID
   */
  async adminDeleteAttendance(recordId: string): Promise<void> {
    const result = await query(
      'DELETE FROM attendance_records WHERE id = $1',
      [recordId]
    );
    if (result.rowCount === 0) {
      throw new Error('Attendance record not found');
    }
  }

  private mapRowToAttendance(row: Record<string, unknown>): AttendanceRecord {
    return {
      id: row.id as string,
      employeeId: row.employee_id as string,
      date: row.date as string,
      clockIn: row.clock_in as string | null,
      clockOut: row.clock_out as string | null,
      breakDuration: row.break_duration as number,
      totalHours: row.total_hours as number | null,
      status: row.status as AttendanceRecord['status'],
      notes: row.notes as string | null,
      modifiedBy: row.modified_by as string | null,
      createdAt: row.created_at as Date,
    };
  }
}

export default new AttendanceService();
