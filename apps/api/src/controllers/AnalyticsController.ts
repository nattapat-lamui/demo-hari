import { Request, Response } from 'express';
import { query } from '../db';
import { getAuditLogs } from '../middlewares/auditLog';

class AnalyticsController {
  /**
   * GET /api/analytics/dashboard
   * Returns all analytics data in a single response for the Deep Analytics page.
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const [
        headcount,
        departments,
        attendance,
        leaveByType,
        performance,
        turnover,
      ] = await Promise.all([
        this.fetchHeadcountGrowth(),
        this.fetchDepartmentDistribution(),
        this.fetchAttendanceTrends(),
        this.fetchLeaveByType(),
        this.fetchPerformanceDistribution(),
        this.fetchTurnover(),
      ]);

      res.json({
        headcount,
        departments,
        attendance,
        leaveByType,
        performance,
        turnover,
      });
    } catch (err) {
      console.error('Error fetching analytics dashboard:', err);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  }

  /**
   * GET /api/analytics/headcount-stats
   * Standalone headcount endpoint (used by AdminDashboard).
   */
  async getHeadcountStats(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.fetchHeadcountGrowth();
      res.json(data);
    } catch (err) {
      console.error('Error fetching headcount stats:', err);
      res.status(500).json({ error: 'Failed to get headcount stats' });
    }
  }

  /**
   * GET /api/analytics/audit-logs
   * In-memory audit logs for AdminDashboard.
   */
  async getAuditLogs(_req: Request, res: Response): Promise<void> {
    try {
      const auditLogs = getAuditLogs(100);
      const logs = auditLogs.map((log, index) => ({
        id: index + 1,
        user: log.userEmail || 'System',
        action: log.action,
        target: log.resource,
        time: new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
        }),
        type: log.resource === 'Employee' ? 'user' : log.resource === 'Leave Request' ? 'leave' : log.resource === 'Document' ? 'policy' : 'user',
      }));
      res.json(logs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }

  // ── Headcount Growth (last 6 months, new hires per month) ──────────
  private async fetchHeadcountGrowth() {
    const result = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', COALESCE(join_date, created_at::date)), 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM employees
      WHERE COALESCE(join_date, created_at::date) >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY month
      ORDER BY month
    `);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const countMap = new Map<string, number>();
    for (const r of result.rows as { month: string; count: string }[]) {
      countMap.set(r.month, parseInt(r.count, 10));
    }

    // Always return all 6 months, fill 0 for months with no hires
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      data.push({
        name: monthNames[d.getMonth()],
        value: countMap.get(key) || 0,
      });
    }
    return data;
  }

  // ── Department Distribution (active employees) ─────────────────────
  private async fetchDepartmentDistribution() {
    const result = await query(`
      SELECT department, COUNT(*) AS count
      FROM employees
      WHERE status = 'Active' AND department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
    `);
    return result.rows.map((r: { department: string; count: string }) => ({
      name: r.department,
      value: parseInt(r.count, 10),
    }));
  }

  // ── Attendance Trends (last 14 weekdays) ───────────────────────────
  private async fetchAttendanceTrends() {
    const result = await query(`
      SELECT
        TO_CHAR(date, 'MM/DD') AS day,
        date,
        COUNT(*) FILTER (WHERE status = 'On-time') AS on_time,
        COUNT(*) FILTER (WHERE status = 'Late') AS late,
        COUNT(*) FILTER (WHERE status = 'Absent') AS absent
      FROM attendance_records
      WHERE date >= CURRENT_DATE - INTERVAL '21 days'
        AND EXTRACT(DOW FROM date) BETWEEN 1 AND 5
      GROUP BY date
      ORDER BY date DESC
      LIMIT 14
    `);
    return result.rows
      .map((r: { day: string; on_time: string; late: string; absent: string }) => ({
        day: r.day,
        onTime: parseInt(r.on_time, 10),
        late: parseInt(r.late, 10),
        absent: parseInt(r.absent, 10),
      }))
      .reverse();
  }

  // ── Leave Usage by Type (approved, this year) ──────────────────────
  private async fetchLeaveByType() {
    const result = await query(`
      SELECT
        leave_type AS type,
        COUNT(*) AS requests,
        COALESCE(SUM(
          CASE WHEN end_date >= start_date
            THEN (end_date - start_date + 1)
            ELSE 0 END
        ), 0) AS days
      FROM leave_requests
      WHERE status = 'Approved'
        AND start_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY leave_type
      ORDER BY days DESC
    `);
    return result.rows.map((r: { type: string; requests: string; days: string }) => ({
      type: r.type,
      requests: parseInt(r.requests, 10),
      days: parseInt(r.days, 10),
    }));
  }

  // ── Performance Rating Distribution ────────────────────────────────
  private async fetchPerformanceDistribution() {
    const result = await query(`
      SELECT rating, COUNT(*) AS count
      FROM performance_reviews
      WHERE date >= CURRENT_DATE - INTERVAL '1 year'
      GROUP BY rating
      ORDER BY rating
    `);

    const labels = ['', 'Needs Improvement', 'Developing', 'Solid Performer', 'Exceeds', 'Outstanding'];
    // Fill all ratings 1-5 even if some have 0
    const countMap = new Map<number, number>();
    for (const r of result.rows as { rating: number; count: string }[]) {
      countMap.set(r.rating, parseInt(r.count, 10));
    }

    return [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      label: labels[rating],
      count: countMap.get(rating) || 0,
    }));
  }

  // ── Turnover: Hires vs Departures (last 6 months) ─────────────────
  private async fetchTurnover() {
    const hiresResult = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', COALESCE(join_date, created_at::date)), 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM employees
      WHERE COALESCE(join_date, created_at::date) >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY month
      ORDER BY month
    `);

    // Departures = employees with status 'Terminated' whose last job_history end_date is in range
    const departuresResult = await query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', end_date), 'YYYY-MM') AS month,
        COUNT(*) AS count
      FROM job_history
      WHERE end_date IS NOT NULL
        AND end_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY month
      ORDER BY month
    `);

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hiresMap = new Map<string, number>();
    const deptMap = new Map<string, number>();

    for (const r of hiresResult.rows as { month: string; count: string }[]) {
      hiresMap.set(r.month, parseInt(r.count, 10));
    }
    for (const r of departuresResult.rows as { month: string; count: string }[]) {
      deptMap.set(r.month, parseInt(r.count, 10));
    }

    // Build array for last 6 months
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        name: months[d.getMonth()],
        hires: hiresMap.get(key) || 0,
        departures: deptMap.get(key) || 0,
      });
    }
    return result;
  }
}

export default new AnalyticsController();
