import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Users,
  Banknote,
  Receipt,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';
import { SearchableSelect } from '../components/SearchableSelect';
import { DatePicker } from '../components/DatePicker';
import {
  useMyPayslips,
  useAllPayroll,
  usePayrollSummary,
  useCreatePayroll,
  useUpdatePayrollStatus,
  useAllEmployees,
} from '../hooks/queries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(raw: string) {
  if (!raw) return '-';
  const d = new Date(raw);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusIcon(status: string) {
  if (status === 'Paid') return <CheckCircle2 size={16} className="text-accent-green" />;
  if (status === 'Processed') return <Clock size={16} className="text-primary" />;
  return <AlertCircle size={16} className="text-accent-orange" />;
}

function statusBadge(status: string) {
  const cls = status === 'Paid'
    ? 'text-accent-green bg-accent-green/10'
    : status === 'Processed'
      ? 'text-primary bg-primary/10'
      : 'text-accent-orange bg-accent-orange/10';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Payroll: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const { isAdminView } = useAuth();

  // Toast
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => setToast({ show: true, message, type });

  // Employee payslips
  const { data: myPayslips = [], isLoading: payslipsLoading } = useMyPayslips();

  // Admin: all payroll records + summary for current year
  const { data: allPayroll = [], isLoading: adminLoading } = useAllPayroll(isAdminView);
  const currentYear = new Date().getFullYear();
  const periodStart = `${currentYear}-01-01`;
  const periodEnd = `${currentYear}-12-31`;
  const { data: summary } = usePayrollSummary(isAdminView ? periodStart : '', isAdminView ? periodEnd : '');

  // Create payroll modal
  const [showCreate, setShowCreate] = useState(false);
  const { data: allEmployees = [] } = useAllEmployees();
  const createPayroll = useCreatePayroll();
  const updateStatus = useUpdatePayrollStatus();

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    baseSalary: '',
    overtimeHours: '0',
    bonus: '0',
    deductions: '0',
  });

  const handleCreate = async () => {
    if (!createForm.employeeId || !createForm.payPeriodStart || !createForm.payPeriodEnd || !createForm.baseSalary) {
      showToast(t('errors.requiredField'), 'warning');
      return;
    }
    try {
      await createPayroll.mutateAsync({
        employeeId: createForm.employeeId,
        payPeriodStart: createForm.payPeriodStart,
        payPeriodEnd: createForm.payPeriodEnd,
        baseSalary: parseFloat(createForm.baseSalary),
        overtimeHours: parseFloat(createForm.overtimeHours) || 0,
        bonus: parseFloat(createForm.bonus) || 0,
        deductions: parseFloat(createForm.deductions) || 0,
      });
      showToast('Payroll created successfully', 'success');
      setShowCreate(false);
      setCreateForm({ employeeId: '', payPeriodStart: '', payPeriodEnd: '', baseSalary: '', overtimeHours: '0', bonus: '0', deductions: '0' });
    } catch {
      showToast(t('errors.createFailed'), 'error');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, paymentMethod: status === 'Paid' ? 'Bank Transfer' : undefined });
      showToast('Status updated successfully', 'success');
    } catch {
      showToast(t('errors.statusUpdateFailed'), 'error');
    }
  };

  // Payslip detail expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const records = isAdminView ? allPayroll : myPayslips;
  const isLoading = isAdminView ? adminLoading : payslipsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-text-light dark:text-text-dark text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-base mt-1">{t('subtitle')}</p>
        </div>
        {isAdminView && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            {t('admin.actions.createPayroll')}
          </button>
        )}
      </header>

      {/* Admin Summary Cards */}
      {isAdminView && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<Banknote size={20} />}
            label={t('admin.summary.totalPayroll')}
            value={`฿${formatCurrency(summary.totalPayroll)}`}
            color="text-accent-green bg-accent-green/10"
          />
          <SummaryCard
            icon={<Receipt size={20} />}
            label={t('admin.summary.totalTax')}
            value={`฿${formatCurrency(summary.totalTax)}`}
            color="text-accent-orange bg-accent-orange/10"
          />
          <SummaryCard
            icon={<Users size={20} />}
            label={t('admin.summary.totalEmployees')}
            value={String(summary.totalEmployees)}
            color="text-primary bg-primary/10"
          />
          <SummaryCard
            icon={<TrendingUp size={20} />}
            label={t('admin.summary.paidCount')}
            value={`${summary.paidCount} / ${summary.paidCount + summary.processedCount + summary.pendingCount}`}
            color="text-accent-teal bg-accent-teal/10"
          />
        </div>
      )}

      {/* Admin Status Breakdown */}
      {isAdminView && summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-orange/10"><AlertCircle size={18} className="text-accent-orange" /></div>
            <div>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">{summary.pendingCount}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{t('status.pending')}</p>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Clock size={18} className="text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">{summary.processedCount}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{t('status.processed')}</p>
            </div>
          </div>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-green/10"><CheckCircle2 size={18} className="text-accent-green" /></div>
            <div>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">{summary.paidCount}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{t('status.paid')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payslip List */}
      <section className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h2 className="text-text-light dark:text-text-dark text-xl font-bold tracking-tight">
            {isAdminView ? t('admin.dashboard') : t('employee.myPayslips')}
          </h2>
        </div>

        <div className="divide-y divide-border-light dark:divide-border-dark">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-12 bg-background-light dark:bg-background-dark/50 rounded-lg animate-pulse" />
              </div>
            ))
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted-light dark:text-text-muted-dark">
              <FileText size={40} className="mb-3 opacity-20" />
              <p className="text-sm">{t('empty.noPayslips')}</p>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <DollarSign size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isAdminView && 'employeeName' in record && (
                      <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                        {(record as { employeeName: string }).employeeName}
                      </p>
                    )}
                    <p className={`text-sm ${isAdminView ? 'text-text-muted-light dark:text-text-muted-dark' : 'font-medium text-text-light dark:text-text-dark'}`}>
                      {formatDate(record.payPeriodStart)} — {formatDate(record.payPeriodEnd)}
                    </p>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                      {t('form.baseSalary')}: ฿{formatCurrency(record.baseSalary)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-text-light dark:text-text-dark">฿{formatCurrency(record.netPay)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      {statusIcon(record.status)}
                      {statusBadge(record.status)}
                    </div>
                  </div>
                  {expandedId === record.id ? <ChevronUp size={16} className="text-text-muted-light" /> : <ChevronDown size={16} className="text-text-muted-light" />}
                </button>

                {/* Expanded Detail */}
                {expandedId === record.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-background-light dark:bg-background-dark rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <DetailItem label={t('form.baseSalary')} value={`฿${formatCurrency(record.baseSalary)}`} />
                        <DetailItem label={t('form.overtimeHours')} value={`${record.overtimeHours}h`} />
                        <DetailItem label={t('employee.detail.overtimePay')} value={`฿${formatCurrency(record.overtimePay)}`} />
                        <DetailItem label={t('form.bonus')} value={`฿${formatCurrency(record.bonus)}`} positive />
                        <DetailItem label={t('form.deductions')} value={`-฿${formatCurrency(record.deductions)}`} negative />
                        <DetailItem label={t('form.taxAmount')} value={`-฿${formatCurrency(record.taxAmount)}`} negative />
                        <DetailItem label={t('form.netPay')} value={`฿${formatCurrency(record.netPay)}`} bold />
                        <DetailItem label={t('form.paymentMethod')} value={record.paymentMethod || '-'} />
                      </div>
                      {record.paymentDate && (
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-3">
                          {t('employee.detail.paidOn')}: {formatDate(record.paymentDate)}
                        </p>
                      )}
                      {/* Admin: status change buttons */}
                      {isAdminView && record.status !== 'Paid' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light dark:border-border-dark">
                          {record.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(record.id, 'Processed')}
                              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                            >
                              {t('admin.actions.markAsProcessed')}
                            </button>
                          )}
                          {(record.status === 'Pending' || record.status === 'Processed') && (
                            <button
                              onClick={() => handleStatusChange(record.id, 'Paid')}
                              className="px-3 py-1.5 text-xs font-medium text-accent-green bg-accent-green/10 rounded-lg hover:bg-accent-green/20 transition-colors"
                            >
                              {t('admin.actions.markAsPaid')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Create Payroll Modal */}
      {showCreate && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold text-text-light dark:text-text-dark">{t('form.createTitle')}</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
                <X size={18} className="text-text-muted-light" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Employee Select */}
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{t('form.selectEmployee')}</label>
                <SearchableSelect
                  value={createForm.employeeId}
                  onChange={(val) => {
                    setCreateForm((f) => ({ ...f, employeeId: val }));
                    // Auto-fill salary from employee data
                    const emp = allEmployees.find((e) => e.id === val);
                    if (emp?.salary) setCreateForm((f) => ({ ...f, employeeId: val, baseSalary: String(emp.salary) }));
                  }}
                  options={allEmployees.filter((e) => e.status === 'Active').map((e) => ({
                    value: e.id,
                    label: e.name,
                    subtitle: e.department,
                    avatar: e.avatar || undefined,
                  }))}
                  onSearch={() => {}}
                  placeholder={t('form.selectEmployee')}
                />
              </div>
              {/* Period */}
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  value={createForm.payPeriodStart}
                  onChange={(date) => setCreateForm((f) => ({ ...f, payPeriodStart: date }))}
                  label={t('form.payPeriodStart')}
                  placeholder={t('form.payPeriodStart')}
                />
                <DatePicker
                  value={createForm.payPeriodEnd}
                  onChange={(date) => setCreateForm((f) => ({ ...f, payPeriodEnd: date }))}
                  label={t('form.payPeriodEnd')}
                  placeholder={t('form.payPeriodEnd')}
                  minDate={createForm.payPeriodStart || undefined}
                />
              </div>
              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{t('form.baseSalary')}</label>
                  <input type="number" value={createForm.baseSalary} onChange={(e) => setCreateForm((f) => ({ ...f, baseSalary: e.target.value }))}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{t('form.overtimeHours')}</label>
                  <input type="number" value={createForm.overtimeHours} onChange={(e) => setCreateForm((f) => ({ ...f, overtimeHours: e.target.value }))}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{t('form.bonus')}</label>
                  <input type="number" value={createForm.bonus} onChange={(e) => setCreateForm((f) => ({ ...f, bonus: e.target.value }))}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">{t('form.deductions')}</label>
                  <input type="number" value={createForm.deductions} onChange={(e) => setCreateForm((f) => ({ ...f, deductions: e.target.value }))}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-border-light dark:border-border-dark">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark rounded-lg transition-colors">
                {t('common:buttons.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={createPayroll.isPending}
                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createPayroll.isPending ? t('form.calculating') : t('admin.actions.createPayroll')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast((p) => ({ ...p, show: false }))} />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4">
    <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}>{icon}</div>
    <p className="text-xl font-bold text-text-light dark:text-text-dark">{value}</p>
    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">{label}</p>
  </div>
);

const DetailItem: React.FC<{ label: string; value: string; positive?: boolean; negative?: boolean; bold?: boolean }> = ({ label, value, positive, negative, bold }) => (
  <div>
    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{label}</p>
    <p className={`text-sm mt-0.5 ${
      bold ? 'font-bold text-text-light dark:text-text-dark' :
      positive ? 'text-accent-green font-medium' :
      negative ? 'text-accent-red font-medium' :
      'text-text-light dark:text-text-dark'
    }`}>
      {value}
    </p>
  </div>
);
