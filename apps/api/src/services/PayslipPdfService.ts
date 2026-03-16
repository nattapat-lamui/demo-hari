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
  doc.fontSize(12).text('Payslip / ใบแจ้งเงินเดือน', { align: 'center' });
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
  addRow(doc, 'Income Tax', formatMoney(record.taxAmount));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = record as any;
  if (rec.ssfEmployee) addRow(doc, 'Social Security', formatMoney(rec.ssfEmployee));
  if (rec.pvfEmployee) addRow(doc, 'Provident Fund', formatMoney(rec.pvfEmployee));
  addRow(doc, 'Leave Deduction', formatMoney(record.leaveDeduction));
  addRow(doc, 'Other Deductions', formatMoney(record.deductions));
  const totalDeductions = record.taxAmount + (rec.ssfEmployee || 0) + (rec.pvfEmployee || 0) + record.leaveDeduction + record.deductions;
  doc.moveDown(0.5);
  addRow(doc, 'Total Deductions', formatMoney(totalDeductions), true);
  doc.moveDown();

  // Net pay
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14).text(`Net Pay: ${formatMoney(record.netPay)}`, { align: 'right' });
  doc.moveDown(2);

  // Footer
  doc.fontSize(8).fillColor('gray');
  doc.text('This is a system-generated payslip.', { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

  doc.end();
}

function addRow(doc: PDFKit.PDFDocument, label: string, value: string, bold = false) {
  const y = doc.y;
  if (bold) doc.font('Helvetica-Bold'); else doc.font('Helvetica');
  doc.text(label, 50, y);
  doc.text(value, 400, y, { width: 145, align: 'right' });
  if (bold) doc.font('Helvetica');
}

function formatMoney(n: number): string {
  return `฿${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
