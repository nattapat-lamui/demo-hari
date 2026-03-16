import PDFDocument from 'pdfkit';
import { PayrollRecord } from './PayrollService';

export function generatePayslipPdf(
  record: PayrollRecord & { employeeName: string; department: string; employeeCode?: string },
  stream: NodeJS.WritableStream
): void {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text('HARI HR System', { align: 'center' });
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
  addRow(doc, 'Base Salary', formatMoney(record.baseSalary));
  addRow(doc, `Overtime Pay (${record.overtimeHours} hrs)`, formatMoney(record.overtimePay));
  addRow(doc, 'Bonus', formatMoney(record.bonus));
  doc.moveDown(0.5);
  addRow(doc, 'Total Earnings', formatMoney(record.baseSalary + record.overtimePay + record.bonus), true);
  doc.moveDown();

  // Deductions section
  doc.fontSize(12).text('Deductions', { underline: true });
  doc.fontSize(10);
  addRow(doc, 'Income Tax (PIT)', formatMoney(record.taxAmount));
  if (record.ssfEmployee > 0) addRow(doc, 'Social Security Fund (SSF)', formatMoney(record.ssfEmployee));
  if (record.pvfEmployee > 0) addRow(doc, 'Provident Fund (PVF)', formatMoney(record.pvfEmployee));
  if (record.leaveDeduction > 0) addRow(doc, 'Leave Deduction', formatMoney(record.leaveDeduction));
  if (record.deductions > 0) addRow(doc, 'Other Deductions', formatMoney(record.deductions));
  const totalDeductions = record.taxAmount + record.ssfEmployee + record.pvfEmployee + record.leaveDeduction + record.deductions;
  doc.moveDown(0.5);
  addRow(doc, 'Total Deductions', formatMoney(totalDeductions), true);
  doc.moveDown();

  // Employer contributions (informational)
  if (record.ssfEmployer > 0 || record.pvfEmployer > 0) {
    doc.fontSize(10).text('Employer Contributions (for reference):', { underline: true });
    if (record.ssfEmployer > 0) addRow(doc, 'SSF (Employer)', formatMoney(record.ssfEmployer));
    if (record.pvfEmployer > 0) addRow(doc, 'PVF (Employer)', formatMoney(record.pvfEmployer));
    doc.moveDown();
  }

  // Net pay
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14);
  doc.font('Helvetica-Bold');
  doc.text(`Net Pay: ${formatMoney(record.netPay)}`, { align: 'right' });
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

function formatMoney(n: number): string {
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB`;
}
