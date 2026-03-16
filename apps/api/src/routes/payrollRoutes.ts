import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin, requireOwnerOrAdmin } from '../middlewares/auth';
import PayrollService from '../services/PayrollService';
import { generatePayslipPdf } from '../services/PayslipPdfService';
import { query } from '../db';
import { apiLimiter } from '../middlewares/security';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/payroll/batch
 * Batch create payroll records for all active employees (admin only)
 * NOTE: Must be defined BEFORE / to avoid route shadowing
 */
router.post('/batch', requireAdmin, apiLimiter, async (req: Request, res: Response) => {
  try {
    const { payPeriodStart, payPeriodEnd } = req.body;

    if (!payPeriodStart || !payPeriodEnd) {
      return res.status(400).json({ error: 'payPeriodStart and payPeriodEnd are required' });
    }

    const result = await PayrollService.batchCreatePayroll(payPeriodStart, payPeriodEnd);
    res.status(201).json(result);
  } catch (error: unknown) {
    console.error('Error batch creating payroll:', error);
    const message = error instanceof Error ? error.message : 'Failed to batch create payroll';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /api/payroll
 * Create a new payroll record (admin only)
 */
router.post('/', requireAdmin, apiLimiter, async (req: Request, res: Response) => {
  try {
    const payroll = await PayrollService.createPayroll(req.body);
    res.status(201).json(payroll);
  } catch (error: unknown) {
    console.error('Error creating payroll:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payroll';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/payroll/my-payslips
 * Get payroll history for current user
 */
router.get('/my-payslips', async (req: Request, res: Response) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID not found' });
    }

    const limit = parseInt(req.query.limit as string, 10) || 12;
    const payroll = await PayrollService.getPayrollByEmployee(employeeId, limit);

    res.json(payroll);
  } catch (error: unknown) {
    console.error('Error getting payslips:', error);
    res.status(500).json({ error: 'Failed to get payslips' });
  }
});

/**
 * GET /api/payroll/employee/:employeeId
 * Get payroll for a specific employee (admin or self)
 */
router.get(
  '/employee/:employeeId',
  requireOwnerOrAdmin((req) => req.params.employeeId),
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 12;

      const payroll = await PayrollService.getPayrollByEmployee(employeeId, limit);
      res.json(payroll);
    } catch (error: unknown) {
      console.error('Error getting employee payroll:', error);
      res.status(500).json({ error: 'Failed to get payroll' });
    }
  }
);

/**
 * GET /api/payroll/all
 * Get all payroll records (admin only)
 * NOTE: Must be defined BEFORE /:id to avoid route shadowing
 */
router.get('/all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const payroll = await PayrollService.getAllPayroll(limit);
    res.json(payroll);
  } catch (error: unknown) {
    console.error('Error getting all payroll:', error);
    res.status(500).json({ error: 'Failed to get payroll records' });
  }
});

/**
 * GET /api/payroll/reports/summary
 * Get payroll summary for a period (admin only)
 * NOTE: Must be defined BEFORE /:id to avoid route shadowing
 */
router.get('/reports/summary', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const summary = await PayrollService.getPayrollSummary(
      startDate as string,
      endDate as string
    );

    res.json(summary);
  } catch (error: unknown) {
    console.error('Error getting payroll summary:', error);
    res.status(500).json({ error: 'Failed to get payroll summary' });
  }
});

/**
 * POST /api/payroll/salary/:employeeId
 * Update employee salary (admin only)
 * NOTE: Must be defined BEFORE /:id to avoid route shadowing
 */
router.post('/salary/:employeeId', requireAdmin, apiLimiter, async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { newSalary, changeReason } = req.body;

    if (!newSalary || !changeReason) {
      return res.status(400).json({ error: 'newSalary and changeReason are required' });
    }

    const salaryHistory = await PayrollService.updateSalary(
      employeeId,
      newSalary,
      changeReason,
      req.user?.employeeId ?? undefined
    );

    res.status(201).json(salaryHistory);
  } catch (error: unknown) {
    console.error('Error updating salary:', error);
    const message = error instanceof Error ? error.message : 'Failed to update salary';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/payroll/salary/:employeeId/history
 * Get salary history for an employee (admin or self)
 * NOTE: Must be defined BEFORE /:id to avoid route shadowing
 */
router.get(
  '/salary/:employeeId/history',
  requireOwnerOrAdmin((req) => req.params.employeeId),
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const history = await PayrollService.getSalaryHistory(employeeId);
      res.json(history);
    } catch (error: unknown) {
      console.error('Error getting salary history:', error);
      res.status(500).json({ error: 'Failed to get salary history' });
    }
  }
);

/**
 * GET /api/payroll/:id/payslip
 * Download payslip as PDF
 * NOTE: Must be defined BEFORE /:id to avoid route shadowing
 */
router.get('/:id/payslip', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const record = await PayrollService.getPayrollById(id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });

    // Check access: owner or admin
    if (user?.role !== 'HR_ADMIN' && user?.employeeId !== record.employeeId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get employee details
    const empResult = await query(
      'SELECT name, department, employee_code FROM employees WHERE id = $1',
      [record.employeeId]
    );
    const emp = empResult.rows[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${record.payPeriodStart}-${record.payPeriodEnd}.pdf"`);

    generatePayslipPdf(
      { ...record, employeeName: emp?.name || 'Unknown', department: emp?.department || '', employeeCode: emp?.employee_code },
      res
    );
  } catch (error) {
    console.error('Payslip PDF error:', error);
    res.status(500).json({ error: 'Failed to generate payslip' });
  }
});

/**
 * PUT /api/payroll/:id
 * Update an existing payroll record (admin only, only Pending records)
 */
router.put('/:id', requireAdmin, apiLimiter, async (req: Request, res: Response) => {
  try {
    const payroll = await PayrollService.updatePayroll(req.params.id, req.body);
    res.json(payroll);
  } catch (error: unknown) {
    console.error('Error updating payroll:', error);
    const message = error instanceof Error ? error.message : 'Failed to update payroll';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /api/payroll/:id
 * Get a specific payroll record
 * NOTE: Must be defined AFTER all literal path routes to avoid shadowing
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payroll = await PayrollService.getPayrollById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    // Check if user can access this payroll
    const isOwner = req.user?.employeeId === payroll.employeeId;
    const isAdmin = req.user?.role === 'HR_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(payroll);
  } catch (error: unknown) {
    console.error('Error getting payroll:', error);
    res.status(500).json({ error: 'Failed to get payroll' });
  }
});

/**
 * PATCH /api/payroll/:id/status
 * Update payroll status (admin only)
 */
router.patch('/:id/status', requireAdmin, apiLimiter, async (req: Request, res: Response) => {
  try {
    const { status, paymentMethod } = req.body;

    if (!['Pending', 'Processed', 'Paid', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payroll = await PayrollService.updatePayrollStatus(req.params.id, status, paymentMethod);
    res.json(payroll);
  } catch (error: unknown) {
    console.error('Error updating payroll status:', error);
    const message = error instanceof Error ? error.message : 'Failed to update payroll';
    res.status(400).json({ error: message });
  }
});

export default router;
