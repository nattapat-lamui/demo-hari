import { Request, Response } from 'express';
import { query } from '../db';
import { getAuditLogs } from '../middlewares/auditLog';

class AnalyticsController {
  // GET /api/analytics/headcount-stats
  async getHeadcountStats(req: Request, res: Response): Promise<void> {
    try {
      // Get all employees with their join dates (fall back to created_at if join_date is NULL)
      const result = await query(`
        SELECT COALESCE(join_date, created_at::date) AS effective_date, status
        FROM employees
      `);

      const employees = result.rows;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      const headcountData: { name: string; value: number }[] = [];

      // Generate data for last 6 months - showing NEW HIRES per month
      for (let i = 5; i >= 0; i--) {
        // Calculate the target month
        const targetDate = new Date(currentYear, currentMonth - i, 1);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();

        // Start and end of target month
        const monthStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
        const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

        // Count NEW employees who joined IN this specific month (not cumulative)
        const newHiresThisMonth = employees.filter((e: { effective_date: string; status: string }) => {
          const joinDate = new Date(e.effective_date);
          if (isNaN(joinDate.getTime())) return false;
          // Check if joined within this month's range
          return joinDate >= monthStart && joinDate <= monthEnd;
        }).length;

        headcountData.push({
          name: monthNames[targetMonth],
          value: newHiresThisMonth
        });
      }

      res.json(headcountData);
    } catch (err) {
      console.error("Error fetching headcount stats:", err);
      res.status(500).json({ error: "Failed to get headcount stats" });
    }
  }

  // GET /api/analytics/compliance
  async getCompliance(req: Request, res: Response): Promise<void> {
    try {
      const result = await query("SELECT * FROM compliance_items");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching compliance:", err);
      res.status(500).json({ error: "Failed to fetch compliance data" });
    }
  }

  // GET /api/analytics/sentiment
  async getSentiment(req: Request, res: Response): Promise<void> {
    try {
      // Return array of { name, value }
      const result = await query("SELECT * FROM sentiment_stats");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching sentiment:", err);
      res.status(500).json({ error: "Failed to fetch sentiment data" });
    }
  }

  // GET /api/analytics/audit-logs
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      // Get real-time audit logs from our logging system
      const auditLogs = getAuditLogs(100);

      // Transform to match expected format for frontend
      const logs = auditLogs.map((log, index) => ({
        id: index + 1,
        user: log.userEmail || "System",
        action: log.action,
        target: log.resource,
        time: new Date(log.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: this.getLogType(log.resource),
      }));

      res.json(logs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  }

  // Helper function to map resource to log type for UI
  private getLogType(resource: string): string {
    if (resource === "Employee") return "user";
    if (resource === "Leave Request") return "leave";
    if (resource === "Document") return "policy";
    return "user";
  }
}

export default new AnalyticsController();
