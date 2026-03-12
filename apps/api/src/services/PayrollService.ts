import { query } from '../db';
import SystemConfigService from './SystemConfigService';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  leaveDeduction: number;
  deductions: number;
  taxAmount: number;
  netPay: number;
  status: 'Pending' | 'Processed' | 'Paid' | 'Cancelled';
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface CreatePayrollData {
  employeeId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  baseSalary: number;
  overtimeHours?: number;
  bonus?: number;
  leaveDeduction?: number;
  deductions?: number;
}

export interface SalaryHistory {
  id: string;
  employeeId: string;
  effectiveDate: string;
  baseSalary: number;
  previousSalary: number | null;
  changeReason: string | null;
  approvedBy: string | null;
  createdAt: Date;
}

// Default tax brackets (fallback if system_configs not set up)
const DEFAULT_TAX_BRACKETS = [
  { min: 0, max: 150000, rate: 0 },
  { min: 150000, max: 300000, rate: 0.05 },
  { min: 300000, max: 500000, rate: 0.10 },
  { min: 500000, max: 750000, rate: 0.15 },
  { min: 750000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: 2000000, rate: 0.25 },
  { min: 2000000, max: 5000000, rate: 0.30 },
  { min: 5000000, max: -1, rate: 0.35 },
];

const DEFAULT_STANDARD_HOURS = 160;
const DEFAULT_PERSONAL_ALLOWANCE = 60000;
const DEFAULT_EXPENSE_DEDUCTION = 100000;

interface PayrollConfig {
  standardHoursPerMonth: number;
  taxBrackets: { min: number; max: number; rate: number }[];
  personalAllowance: number;
  expenseDeduction: number;
}

export class PayrollService {
  /**
   * Load payroll configuration from system_configs
   */
  private async getPayrollConfig(): Promise<PayrollConfig> {
    const [standardHours, taxBrackets, personalAllowance, expenseDeduction] = await Promise.all([
      SystemConfigService.getConfigValue('payroll', 'standard_hours_per_month', DEFAULT_STANDARD_HOURS),
      SystemConfigService.getConfigValue('payroll', 'tax_brackets', DEFAULT_TAX_BRACKETS),
      SystemConfigService.getConfigValue('payroll', 'personal_allowance', DEFAULT_PERSONAL_ALLOWANCE),
      SystemConfigService.getConfigValue('payroll', 'expense_deduction', DEFAULT_EXPENSE_DEDUCTION),
    ]);

    return {
      standardHoursPerMonth: typeof standardHours === 'number' ? standardHours : DEFAULT_STANDARD_HOURS,
      taxBrackets: Array.isArray(taxBrackets) ? taxBrackets : DEFAULT_TAX_BRACKETS,
      personalAllowance: typeof personalAllowance === 'number' ? personalAllowance : DEFAULT_PERSONAL_ALLOWANCE,
      expenseDeduction: typeof expenseDeduction === 'number' ? expenseDeduction : DEFAULT_EXPENSE_DEDUCTION,
    };
  }

  /**
   * Calculate tax based on annual salary using progressive brackets
   * Applies expense deduction (50% of income, capped) and personal allowance before tax
   */
  private calculateTax(
    annualSalary: number,
    brackets: { min: number; max: number; rate: number }[],
    expenseDeduction: number,
    personalAllowance: number
  ): number {
    // Expense deduction: 50% of income, capped at expenseDeduction
    const expense = Math.min(annualSalary * 0.5, expenseDeduction);
    // Taxable income after deductions
    const taxableIncome = Math.max(0, annualSalary - expense - personalAllowance);

    let tax = 0;
    let remainingSalary = taxableIncome;

    for (const bracket of brackets) {
      if (remainingSalary <= 0) break;

      const bracketMax = bracket.max === -1 ? Infinity : bracket.max;
      const taxableInBracket = Math.min(remainingSalary, bracketMax - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingSalary -= taxableInBracket;
    }

    return Math.round(tax * 100) / 100;
  }

  /**
   * Create payroll record for an employee
   */
  async createPayroll(data: CreatePayrollData): Promise<PayrollRecord> {
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      baseSalary,
      overtimeHours = 0,
      bonus = 0,
      leaveDeduction = 0,
      deductions = 0,
    } = data;

    // Check for duplicate payroll (same employee + same pay period, excluding Cancelled)
    const existing = await query(
      `SELECT id FROM payroll_records
       WHERE employee_id = $1 AND pay_period_start = $2 AND pay_period_end = $3 AND status != 'Cancelled'`,
      [employeeId, payPeriodStart, payPeriodEnd]
    );
    if (existing.rows.length > 0) {
      throw new Error('A payroll record already exists for this employee and pay period');
    }

    // Load payroll config
    const config = await this.getPayrollConfig();

    // Calculate overtime pay (1.5x hourly rate)
    const hourlyRate = baseSalary / config.standardHoursPerMonth;
    const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5 * 100) / 100;

    // Calculate gross pay
    const grossPay = baseSalary + overtimePay + bonus;

    // Calculate tax (Thai PND.1 annualization method)
    // Base salary is regular income (x12), OT and bonus are irregular income (added as-is)
    const annualIncome = (baseSalary * 12) + overtimePay + bonus;
    const annualTax = this.calculateTax(annualIncome, config.taxBrackets, config.expenseDeduction, config.personalAllowance);
    const monthlyTax = Math.round(annualTax / 12 * 100) / 100;

    // Calculate net pay (gross - leave deduction - other deductions - tax)
    const netPay = Math.round((grossPay - leaveDeduction - deductions - monthlyTax) * 100) / 100;

    const result = await query(
      `INSERT INTO payroll_records
       (employee_id, pay_period_start, pay_period_end, base_salary, overtime_hours, overtime_pay, bonus, leave_deduction, deductions, tax_amount, net_pay)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [employeeId, payPeriodStart, payPeriodEnd, baseSalary, overtimeHours, overtimePay, bonus, leaveDeduction, deductions, monthlyTax, netPay]
    );

    return this.mapRowToPayroll(result.rows[0]);
  }

  /**
   * Get payroll records for an employee
   */
  async getPayrollByEmployee(employeeId: string, limit: number = 12): Promise<PayrollRecord[]> {
    const result = await query(
      `SELECT * FROM payroll_records
       WHERE employee_id = $1
       ORDER BY pay_period_start DESC
       LIMIT $2`,
      [employeeId, limit]
    );

    return result.rows.map(this.mapRowToPayroll);
  }

  /**
   * Get all payroll records with employee names (admin)
   */
  async getAllPayroll(limit: number = 50): Promise<(PayrollRecord & { employeeName: string; department: string })[]> {
    const result = await query(
      `SELECT pr.*, e.name AS employee_name, e.department
       FROM payroll_records pr
       LEFT JOIN employees e ON pr.employee_id = e.id
       ORDER BY pr.pay_period_start DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      ...this.mapRowToPayroll(row),
      employeeName: (row.employee_name as string) || 'Unknown',
      department: (row.department as string) || '',
    }));
  }

  /**
   * Get payroll by ID
   */
  async getPayrollById(id: string): Promise<PayrollRecord | null> {
    const result = await query('SELECT * FROM payroll_records WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPayroll(result.rows[0]);
  }

  /**
   * Update payroll status
   */
  async updatePayrollStatus(
    id: string,
    status: 'Pending' | 'Processed' | 'Paid' | 'Cancelled',
    paymentMethod?: string
  ): Promise<PayrollRecord> {
    const paymentDate = status === 'Paid' ? new Date().toISOString().split('T')[0] : null;

    const result = await query(
      `UPDATE payroll_records
       SET status = $1, payment_date = $2, payment_method = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, paymentDate, paymentMethod, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Payroll record not found');
    }

    return this.mapRowToPayroll(result.rows[0]);
  }

  /**
   * Get payroll summary for a period
   */
  async getPayrollSummary(startDate: string, endDate: string): Promise<{
    totalPayroll: number;
    totalTax: number;
    totalEmployees: number;
    pendingCount: number;
    processedCount: number;
    paidCount: number;
    cancelledCount: number;
  }> {
    const result = await query(
      `SELECT
        COALESCE(SUM(net_pay) FILTER (WHERE status != 'Cancelled'), 0) as total_payroll,
        COALESCE(SUM(tax_amount) FILTER (WHERE status != 'Cancelled'), 0) as total_tax,
        COUNT(DISTINCT employee_id) FILTER (WHERE status != 'Cancelled') as total_employees,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'Processed') as processed_count,
        COUNT(*) FILTER (WHERE status = 'Paid') as paid_count,
        COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_count
       FROM payroll_records
       WHERE pay_period_start >= $1 AND pay_period_end <= $2`,
      [startDate, endDate]
    );

    const row = result.rows[0];
    return {
      totalPayroll: parseFloat(row.total_payroll),
      totalTax: parseFloat(row.total_tax),
      totalEmployees: parseInt(row.total_employees, 10),
      pendingCount: parseInt(row.pending_count, 10),
      processedCount: parseInt(row.processed_count, 10),
      paidCount: parseInt(row.paid_count, 10),
      cancelledCount: parseInt(row.cancelled_count, 10),
    };
  }

  /**
   * Update employee salary and record history
   */
  async updateSalary(
    employeeId: string,
    newSalary: number,
    changeReason: string,
    approvedById?: string
  ): Promise<SalaryHistory> {
    // Get current salary
    const currentResult = await query(
      'SELECT base_salary FROM salary_history WHERE employee_id = $1 ORDER BY effective_date DESC LIMIT 1',
      [employeeId]
    );

    const previousSalary = currentResult.rows.length > 0 ? currentResult.rows[0].base_salary : null;

    // Insert new salary history
    const result = await query(
      `INSERT INTO salary_history (employee_id, effective_date, base_salary, previous_salary, change_reason, approved_by)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       RETURNING *`,
      [employeeId, newSalary, previousSalary, changeReason, approvedById]
    );

    return this.mapRowToSalaryHistory(result.rows[0]);
  }

  /**
   * Batch create payroll records for all active employees
   * Skips employees that already have a non-cancelled record for the same period
   */
  async batchCreatePayroll(payPeriodStart: string, payPeriodEnd: string): Promise<{
    created: number;
    skipped: number;
    skippedEmployees: string[];
  }> {
    // Get all active employees with their salary (from employees table or salary_history)
    const employees = await query(
      `SELECT e.id, e.name, COALESCE(e.salary, sh.base_salary, 0) AS salary
       FROM employees e
       LEFT JOIN LATERAL (
         SELECT base_salary FROM salary_history
         WHERE employee_id = e.id
         ORDER BY effective_date DESC LIMIT 1
       ) sh ON true
       WHERE e.status = 'Active'`
    );

    // Load payroll config once for all employees
    const config = await this.getPayrollConfig();

    let created = 0;
    let skipped = 0;
    const skippedEmployees: string[] = [];

    for (const emp of employees.rows) {
      const salary = parseFloat(emp.salary);
      if (!salary || salary <= 0) {
        skipped++;
        skippedEmployees.push(`${emp.name} (no salary)`);
        continue;
      }

      // Check if payroll already exists for this period (excluding Cancelled)
      const existing = await query(
        `SELECT id FROM payroll_records
         WHERE employee_id = $1 AND pay_period_start = $2 AND pay_period_end = $3 AND status != 'Cancelled'`,
        [emp.id, payPeriodStart, payPeriodEnd]
      );

      if (existing.rows.length > 0) {
        skipped++;
        skippedEmployees.push(`${emp.name} (already exists)`);
        continue;
      }

      // Calculate payroll (base salary only — OT/bonus are 0, admin edits later; tax recalculated on edit)
      const annualIncome = salary * 12;
      const annualTax = this.calculateTax(annualIncome, config.taxBrackets, config.expenseDeduction, config.personalAllowance);
      const monthlyTax = Math.round(annualTax / 12 * 100) / 100;
      const netPay = Math.round((salary - monthlyTax) * 100) / 100;

      await query(
        `INSERT INTO payroll_records
         (employee_id, pay_period_start, pay_period_end, base_salary, overtime_hours, overtime_pay, bonus, leave_deduction, deductions, tax_amount, net_pay)
         VALUES ($1, $2, $3, $4, 0, 0, 0, 0, 0, $5, $6)`,
        [emp.id, payPeriodStart, payPeriodEnd, salary, monthlyTax, netPay]
      );
      created++;
    }

    return { created, skipped, skippedEmployees };
  }

  /**
   * Get salary history for an employee
   */
  async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    const result = await query(
      'SELECT * FROM salary_history WHERE employee_id = $1 ORDER BY effective_date DESC',
      [employeeId]
    );

    return result.rows.map(this.mapRowToSalaryHistory);
  }

  private mapRowToPayroll(row: Record<string, unknown>): PayrollRecord {
    return {
      id: row.id as string,
      employeeId: row.employee_id as string,
      payPeriodStart: row.pay_period_start as string,
      payPeriodEnd: row.pay_period_end as string,
      baseSalary: parseFloat(row.base_salary as string),
      overtimeHours: parseFloat(row.overtime_hours as string),
      overtimePay: parseFloat(row.overtime_pay as string),
      bonus: parseFloat(row.bonus as string),
      leaveDeduction: parseFloat(row.leave_deduction as string) || 0,
      deductions: parseFloat(row.deductions as string),
      taxAmount: parseFloat(row.tax_amount as string),
      netPay: parseFloat(row.net_pay as string),
      status: row.status as PayrollRecord['status'],
      paymentDate: row.payment_date as string | null,
      paymentMethod: row.payment_method as string | null,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
    };
  }

  private mapRowToSalaryHistory(row: Record<string, unknown>): SalaryHistory {
    return {
      id: row.id as string,
      employeeId: row.employee_id as string,
      effectiveDate: row.effective_date as string,
      baseSalary: parseFloat(row.base_salary as string),
      previousSalary: row.previous_salary ? parseFloat(row.previous_salary as string) : null,
      changeReason: row.change_reason as string | null,
      approvedBy: row.approved_by as string | null,
      createdAt: row.created_at as Date,
    };
  }
}

export default new PayrollService();
