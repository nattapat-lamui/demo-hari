import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { PayrollRecord } from './PayrollService';

const THAI_FONT_REGULAR = path.join(__dirname, '../fonts/NotoSansThai-Regular.ttf');
const THAI_FONT_BOLD = path.join(__dirname, '../fonts/NotoSansThai-Bold.ttf');
const HAS_THAI_FONT = fs.existsSync(THAI_FONT_REGULAR);
const HAS_THAI_BOLD = fs.existsSync(THAI_FONT_BOLD);

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

  // Register Thai fonts for Thai character support
  if (HAS_THAI_FONT) {
    doc.registerFont('MainFont', THAI_FONT_REGULAR);
  }
  if (HAS_THAI_BOLD) {
    doc.registerFont('MainFontBold', THAI_FONT_BOLD);
  }

  const fontName = HAS_THAI_FONT ? 'MainFont' : 'Helvetica';
  const fontBold = HAS_THAI_BOLD ? 'MainFontBold' : (HAS_THAI_FONT ? 'MainFont' : 'Helvetica-Bold');

  doc.pipe(stream);

  // Header
  doc.font(fontBold).fontSize(20).text(companyName, { align: 'center' });
  doc.font(fontName).fontSize(12).text('Payslip / \u0E43\u0E1A\u0E41\u0E08\u0E49\u0E07\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19', { align: 'center' });
  doc.moveDown();

  // Employee info
  doc.font(fontName).fontSize(10);
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
  doc.font(fontBold).fontSize(12).text('Earnings / \u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A', { underline: true });
  doc.font(fontName).fontSize(10);
  addRow(doc, 'Base Salary / \u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19', fmt(record.baseSalary), false, fontName, fontBold);
  addRow(doc, `Overtime Pay / \u0E04\u0E48\u0E32\u0E25\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32 (${record.overtimeHours} hrs)`, fmt(record.overtimePay), false, fontName, fontBold);
  addRow(doc, 'Bonus / \u0E42\u0E1A\u0E19\u0E31\u0E2A', fmt(record.bonus), false, fontName, fontBold);
  doc.moveDown(0.5);
  addRow(doc, 'Total Earnings / \u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A', fmt(record.baseSalary + record.overtimePay + record.bonus), true, fontName, fontBold);
  doc.moveDown();

  // Deductions section
  doc.font(fontBold).fontSize(12).text('Deductions / \u0E23\u0E32\u0E22\u0E2B\u0E31\u0E01', { underline: true });
  doc.font(fontName).fontSize(10);
  addRow(doc, 'Income Tax / \u0E20\u0E32\u0E29\u0E35\u0E40\u0E07\u0E34\u0E19\u0E44\u0E14\u0E49', fmt(record.taxAmount), false, fontName, fontBold);
  if (record.ssfEmployee > 0) addRow(doc, 'Social Security / \u0E1B\u0E23\u0E30\u0E01\u0E31\u0E19\u0E2A\u0E31\u0E07\u0E04\u0E21', fmt(record.ssfEmployee), false, fontName, fontBold);
  if (record.pvfEmployee > 0) addRow(doc, 'Provident Fund / \u0E01\u0E2D\u0E07\u0E17\u0E38\u0E19\u0E2A\u0E33\u0E23\u0E2D\u0E07\u0E2F', fmt(record.pvfEmployee), false, fontName, fontBold);
  if (record.leaveDeduction > 0) addRow(doc, 'Leave Deduction / \u0E2B\u0E31\u0E01\u0E25\u0E32', fmt(record.leaveDeduction), false, fontName, fontBold);
  if (record.deductions > 0) addRow(doc, 'Other Deductions / \u0E2B\u0E31\u0E01\u0E2D\u0E37\u0E48\u0E19\u0E46', fmt(record.deductions), false, fontName, fontBold);
  const totalDeductions = record.taxAmount + record.ssfEmployee + record.pvfEmployee + record.leaveDeduction + record.deductions;
  doc.moveDown(0.5);
  addRow(doc, 'Total Deductions / \u0E23\u0E27\u0E21\u0E2B\u0E31\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14', fmt(totalDeductions), true, fontName, fontBold);
  doc.moveDown();

  // Employer contributions (informational)
  if (record.ssfEmployer > 0 || record.pvfEmployer > 0) {
    doc.font(fontName).fontSize(10).text('Employer Contributions (for reference):', { underline: true });
    if (record.ssfEmployer > 0) addRow(doc, 'SSF (Employer)', fmt(record.ssfEmployer), false, fontName, fontBold);
    if (record.pvfEmployer > 0) addRow(doc, 'PVF (Employer)', fmt(record.pvfEmployer), false, fontName, fontBold);
    doc.moveDown();
  }

  // Net pay
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14);
  doc.font(fontBold);
  doc.text(`Net Pay / \u0E40\u0E07\u0E34\u0E19\u0E2A\u0E38\u0E17\u0E18\u0E34: ${fmt(record.netPay)}`, { align: 'right' });
  doc.font(fontName);
  doc.moveDown(2);

  // Footer
  doc.fontSize(8).fillColor('gray');
  doc.text('This is a system-generated payslip. / \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E19\u0E35\u0E49\u0E2D\u0E2D\u0E01\u0E42\u0E14\u0E22\u0E23\u0E30\u0E1A\u0E1A\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34', { align: 'center' });
  doc.text(`Generated on ${new Date().toISOString().split('T')[0]}`, { align: 'center' });

  doc.end();
}

function addRow(doc: PDFKit.PDFDocument, label: string, value: string, bold = false, fontName = 'Helvetica', fontBold = 'Helvetica-Bold') {
  const y = doc.y;
  if (bold) doc.font(fontBold); else doc.font(fontName);
  doc.text(label, 50, y);
  doc.text(value, 400, y, { width: 145, align: 'right' });
  doc.font(fontName);
}
