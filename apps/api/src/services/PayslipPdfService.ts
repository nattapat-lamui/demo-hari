import PDFDocument from 'pdfkit';
import { PayrollRecord } from './PayrollService';

export interface PayslipOptions {
  companyName?: string;
  currency?: string;
}

export function generatePayslipPdf(
  record: PayrollRecord & { employeeName: string; department: string; employeeCode?: string },
  stream: NodeJS.WritableStream,
  options: PayslipOptions = {}
): void {
  const companyName = options.companyName || 'HARI HR System';
  const currency = options.currency || 'THB';
  const fmt = (n: number) => `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text(companyName, { align: 'center' });
  doc.fontSize(12).text('Payslip', { align: 'center' });
  doc.moveDown();

  // Employee info
  doc.fontSize(10);
  doc.text(`Employee: ${record.employeeName}`);
  doc.text(`Department: ${record.department}`);
  if (record.employeeCode) doc.text(`Employee Code: ${record.employeeCode}`);
  doc.text(`Pay Period: ${record.payPeriodStart} to ${record.payPeriodEnd}`);
  doc.text(`Payment Date: ${record.paymentDate || 'N/A'}`);
  doc.text(`Payment Method: ${record.paymentMethod || 'N/A'}`);
  doc.moveDown();

  // Draw a line
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  // Earnings section
  doc.fontSize(12).text('Earnings', { underline: true });
  doc.fontSize(10);
  addRow(doc, 'Base Salary', fmt(record.baseSalary));
  addRow(doc, `Overtime Pay (${record.overtimeHours} hrs)`, fmt(record.overtimePay));
  addRow(doc, 'Bonus', fmt(record.bonus));
  doc.moveDown(0.5);
  addRow(doc, 'Total Earnings', fmt(record.baseSalary + record.overtimePay + record.bonus), true);
  doc.moveDown();

  // Deductions section
  doc.fontSize(12).text('Deductions', { underline: true });
  doc.fontSize(10);
  addRow(doc, 'Income Tax (PIT)', fmt(record.taxAmount));
  if (record.ssfEmployee > 0) addRow(doc, 'Social Security Fund (SSF)', fmt(record.ssfEmployee));
  if (record.pvfEmployee > 0) addRow(doc, 'Provident Fund (PVF)', fmt(record.pvfEmployee));
  if (record.leaveDeduction > 0) addRow(doc, 'Leave Deduction', fmt(record.leaveDeduction));
  if (record.deductions > 0) addRow(doc, 'Other Deductions', fmt(record.deductions));
  const totalDeductions = record.taxAmount + record.ssfEmployee + record.pvfEmployee + record.leaveDeduction + record.deductions;
  doc.moveDown(0.5);
  addRow(doc, 'Total Deductions', fmt(totalDeductions), true);
  doc.moveDown();

  // Employer contributions (informational)
  if (record.ssfEmployer > 0 || record.pvfEmployer > 0) {
    doc.fontSize(10).text('Employer Contributions (for reference):', { underline: true });
    if (record.ssfEmployer > 0) addRow(doc, 'SSF (Employer)', fmt(record.ssfEmployer));
    if (record.pvfEmployer > 0) addRow(doc, 'PVF (Employer)', fmt(record.pvfEmployer));
    doc.moveDown();
  }

  // Net pay
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14);
  doc.font('Helvetica-Bold');
  doc.text(`Net Pay: ${fmt(record.netPay)}`, { align: 'right' });
  doc.font('Helvetica');
  doc.moveDown(2);

  // Footer
  doc.fontSize(8).fillColor('gray');
  doc.text('This is a system-generated payslip.', { align: 'center' });
  doc.text(`Generated on ${new Date().toISOString().split('T')[0]}`, { align: 'center' });

  doc.end();
}

function addRow(doc: PDFKit.PDFDocument, label: string, value: string, bold = false) {
  const y = doc.y;
  if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
  doc.text(label, 50, y);
  doc.text(value, 400, y, { width: 145, align: 'right' });
  doc.font('Helvetica');
}
