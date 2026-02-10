import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import AttendanceService from '../services/AttendanceService';

const router = Router();

// All admin attendance routes require authentication + admin role
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/attendance/snapshot
 * Get today's attendance snapshot (present/late/absent/remote/halfDay/total)
 */
router.get('/snapshot', async (_req: Request, res: Response) => {
  try {
    const snapshot = await AttendanceService.adminGetTodaySnapshot();
    res.json(snapshot);
  } catch (error: unknown) {
    console.error('Error getting attendance snapshot:', error);
    res.status(500).json({ error: 'Failed to get attendance snapshot' });
  }
});

/**
 * GET /api/admin/attendance/records
 * Get paginated attendance records with filters
 * Query params: search, department, status, startDate, endDate, page, limit
 */
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { search, department, status, startDate, endDate, page, limit } = req.query;

    const result = await AttendanceService.adminGetAllAttendance({
      search: search as string | undefined,
      department: department as string | undefined,
      status: status as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json(result);
  } catch (error: unknown) {
    console.error('Error getting admin attendance records:', error);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

/**
 * PUT /api/admin/attendance/records
 * Upsert (create or update) an attendance record
 * Body: { employeeId, date, clockIn?, clockOut?, status?, notes? }
 */
router.put('/records', async (req: Request, res: Response) => {
  try {
    const { employeeId, date, clockIn, clockOut, status, notes } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const record = await AttendanceService.adminUpsertAttendance({
      employeeId,
      date,
      clockIn,
      clockOut,
      status,
      notes,
      modifiedBy: req.user!.userId,
    });

    res.json(record);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upsert attendance record';
    console.error('Error upserting attendance:', error);
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /api/admin/attendance/records/:id
 * Delete an attendance record
 */
router.delete('/records/:id', async (req: Request, res: Response) => {
  try {
    await AttendanceService.adminDeleteAttendance(req.params.id);
    res.json({ message: 'Attendance record deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete attendance record';
    console.error('Error deleting attendance:', error);
    res.status(400).json({ error: message });
  }
});

export default router;
