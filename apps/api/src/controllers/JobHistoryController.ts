import { Request, Response } from 'express';
import JobHistoryService from '../services/JobHistoryService';
import { safeErrorMessage } from '../utils/errorResponse';

class JobHistoryController {
  // GET /api/job-history
  async getJobHistory(req: Request, res: Response): Promise<void> {
    const { employeeId } = req.query;
    try {
      if (employeeId) {
        const history = await JobHistoryService.getByEmployeeId(employeeId as string);
        const mapped = history.map(h => ({
          ...h,
          endDate: h.endDate || 'Present',
        }));
        res.json(mapped);
      } else {
        // Return empty if no employeeId
        res.json([]);
      }
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to fetch job history') });
    }
  }

  // POST /api/job-history
  async createJobHistory(req: Request, res: Response): Promise<void> {
    const { employeeId, role, department, startDate, endDate, description } = req.body;

    if (!employeeId || !role || !department || !startDate) {
      res.status(400).json({ error: 'Employee ID, role, department, and start date are required' });
      return;
    }

    try {
      const user = req.user as any;
      const entry = await JobHistoryService.create({
        employeeId, role, department, startDate, endDate, description,
        createdBy: user?.id || null,
      });
      res.status(201).json({
        ...entry,
        endDate: entry.endDate || 'Present',
      });
    } catch (err) {
      res.status(400).json({ error: safeErrorMessage(err, 'Failed to create job history') });
    }
  }

  // PUT /api/job-history/:id
  async updateJobHistory(req: Request, res: Response): Promise<void> {
    try {
      const { role, department, startDate, endDate, description } = req.body;
      const entry = await JobHistoryService.update(req.params.id, {
        role, department, startDate, endDate, description,
      });
      if (!entry) { res.status(404).json({ error: 'Job history entry not found' }); return; }
      res.json({
        ...entry,
        endDate: entry.endDate || 'Present',
      });
    } catch (err) {
      res.status(400).json({ error: safeErrorMessage(err, 'Failed to update job history') });
    }
  }

  // DELETE /api/job-history/:id
  async deleteJobHistory(req: Request, res: Response): Promise<void> {
    try {
      await JobHistoryService.delete(req.params.id);
      res.json({ message: 'Job history entry deleted' });
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to delete job history') });
    }
  }
}

export default new JobHistoryController();
