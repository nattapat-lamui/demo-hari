import { Request, Response } from 'express';
import { query } from '../db';

class PerformanceController {
  // GET /api/performance/reviews
  async getPerformanceReviews(req: Request, res: Response): Promise<void> {
    const { employeeId } = req.query;
    try {
      let queryText = "SELECT * FROM performance_reviews";
      const params: (string | number | boolean | null)[] = [];
      if (employeeId) {
        queryText += " WHERE employee_id = $1";
        params.push(employeeId as string);
      }
      queryText += " ORDER BY date DESC";

      const result = await query(queryText, params);
      const reviews = result.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        date: row.date,
        rating: row.rating,
        notes: row.notes,
      }));
      res.json(reviews);
    } catch (err) {
      console.error("Error fetching performance reviews:", err);
      res.status(500).json({ error: "Failed to fetch performance reviews" });
    }
  }
}

export default new PerformanceController();
