import { PayrollService } from '../../services/PayrollService';
import { query } from '../../db';

// Mock SystemConfigService to return defaults
jest.mock('../../services/SystemConfigService', () => ({
  __esModule: true,
  default: {
    getConfigValue: jest.fn().mockImplementation((_cat: string, key: string, defaultVal: any) => defaultVal),
  },
}));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('PayrollService', () => {
  let service: PayrollService;

  beforeEach(() => {
    service = new PayrollService();
    jest.clearAllMocks();
  });

  // Helper to build a mock payroll DB row (snake_case)
  const makePayrollRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'test-id',
    employee_id: 'emp-1',
    pay_period_start: '2026-03-01',
    pay_period_end: '2026-03-31',
    base_salary: '10000',
    overtime_hours: '0',
    overtime_pay: '0',
    bonus: '0',
    leave_deduction: '0',
    deductions: '0',
    tax_amount: '0',
    ssf_employee: '0',
    ssf_employer: '0',
    pvf_employee: '0',
    pvf_employer: '0',
    net_pay: '0',
    status: 'Pending',
    payment_date: null,
    payment_method: null,
    notes: null,
    created_at: new Date(),
    ...overrides,
  });

  /**
   * Helper: set up mocks for createPayroll flow:
   *   query #1 → duplicate check (empty)
   *   query #2 → INSERT RETURNING *
   */
  const setupCreateMocks = (baseSalary: number, overtimeHours = 0, bonus = 0, leaveDeduction = 0, deductions = 0) => {
    mockedQuery
      // duplicate check
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
      // INSERT RETURNING *
      .mockResolvedValueOnce({
        rows: [makePayrollRow({
          base_salary: String(baseSalary),
          overtime_hours: String(overtimeHours),
          bonus: String(bonus),
          leave_deduction: String(leaveDeduction),
          deductions: String(deductions),
        })],
        rowCount: 1,
      } as never);
  };

  describe('SSF calculation', () => {
    it('should calculate SSF correctly when base salary is below the cap (10000)', async () => {
      setupCreateMocks(10000);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary: 10000,
      });

      // INSERT is the second query call
      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      // SSF employee = min(10000, 15000) * 0.05 = 500
      const ssfEmployee = insertParams[10]; // index 10: ssfEmployee
      expect(ssfEmployee).toBe(500);
    });

    it('should cap SSF when base salary exceeds the max base (20000)', async () => {
      setupCreateMocks(20000);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary: 20000,
      });

      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      // SSF employee = min(20000, 15000) * 0.05 = 750
      const ssfEmployee = insertParams[10];
      expect(ssfEmployee).toBe(750);
    });
  });

  describe('PVF calculation', () => {
    it('should calculate PVF based on full base salary (30000)', async () => {
      setupCreateMocks(30000);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary: 30000,
      });

      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      // PVF employee = 30000 * 0.03 = 900
      const pvfEmployee = insertParams[12]; // index 12: pvfEmployee
      expect(pvfEmployee).toBe(900);
    });
  });

  describe('Tax deductibility', () => {
    it('SSF and PVF should reduce taxable income (annualIncome - SSF*12 - PVF*12)', async () => {
      const baseSalary = 30000;
      setupCreateMocks(baseSalary);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary,
      });

      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      const ssfEmployee = insertParams[10]; // 750 (capped at 15000 * 0.05)
      const pvfEmployee = insertParams[12]; // 900 (30000 * 0.03)

      // Annual income for tax = baseSalary*12 + OT + bonus - SSF*12 - PVF*12
      // = 360000 + 0 + 0 - 9000 - 10800 = 340200
      // Expense deduction: min(340200 * 0.5, 100000) = 100000
      // After personal allowance: 340200 - 100000 - 60000 = 180200
      // Tax bracket: first 150000 at 0%, next 30200 at 5% = 1510
      // Monthly tax = 1510 / 12 ≈ 125.83
      const monthlyTax = insertParams[9]; // index 9: tax_amount

      // Verify monthly tax is based on income AFTER SSF/PVF deduction
      // Without SSF/PVF: annual = 360000, expense = 100000, personal = 60000
      //   taxable = 200000, tax = 0 + 50000*0.05 = 2500, monthly = 208.33
      // With SSF/PVF: annual = 340200, tax lower
      expect(monthlyTax).toBeLessThan(208.33);
      expect(monthlyTax).toBeGreaterThan(0);
      expect(ssfEmployee).toBe(750);
      expect(pvfEmployee).toBe(900);
    });
  });

  describe('Net pay calculation', () => {
    it('netPay = grossPay - tax - SSF - PVF - leaveDeduction - deductions', async () => {
      const baseSalary = 30000;
      const leaveDeduction = 500;
      const deductions = 200;
      setupCreateMocks(baseSalary, 0, 0, leaveDeduction, deductions);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary,
        leaveDeduction,
        deductions,
      });

      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      const overtimePay = insertParams[5];
      const bonus = insertParams[6];
      const monthlyTax = insertParams[9];
      const ssfEmployee = insertParams[10];
      const pvfEmployee = insertParams[12];
      const netPay = insertParams[14];

      const grossPay = baseSalary + overtimePay + bonus;
      const expectedNet = Math.round((grossPay - leaveDeduction - deductions - monthlyTax - ssfEmployee - pvfEmployee) * 100) / 100;

      expect(netPay).toBe(expectedNet);
    });
  });

  describe('OT multiplier', () => {
    it('should calculate overtime pay as (baseSalary/160) * hours * 1.5', async () => {
      const baseSalary = 16000;
      const overtimeHours = 10;
      setupCreateMocks(baseSalary, overtimeHours);

      await service.createPayroll({
        employeeId: 'emp-1',
        payPeriodStart: '2026-03-01',
        payPeriodEnd: '2026-03-31',
        baseSalary,
        overtimeHours,
      });

      const insertCall = mockedQuery.mock.calls[1];
      const insertParams = insertCall[1] as any[];

      // hourlyRate = 16000/160 = 100
      // overtimePay = 10 * 100 * 1.5 = 1500
      const overtimePay = insertParams[5];
      expect(overtimePay).toBe(1500);
    });
  });
});
