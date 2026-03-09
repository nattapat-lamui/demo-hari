import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  FileEdit,
  User,
  FileText,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Toast } from '../components/Toast';
import { Dropdown } from '../components/Dropdown';
import { useComplianceChecks, useComplianceAuditLogs } from '../hooks/queries';
import { BASE_URL, getAuthToken } from '../lib/api';

// Data point options for report builder
const DATA_POINTS = [
  { key: 'department', labelKey: 'reportBuilder.department' },
  { key: 'salary', labelKey: 'reportBuilder.salary' },
  { key: 'startDate', labelKey: 'reportBuilder.startDate' },
  { key: 'performanceRating', labelKey: 'reportBuilder.performanceRating' },
  { key: 'leaveBalance', labelKey: 'reportBuilder.leaveBalance' },
] as const;

const DATE_RANGES = [
  { value: 'last30', labelKey: 'reportBuilder.rangeLast30' },
  { value: 'last90', labelKey: 'reportBuilder.rangeLast90' },
  { value: 'thisYear', labelKey: 'reportBuilder.rangeThisYear' },
] as const;

// Audit log resource icon mapping
function getResourceIcon(resource: string) {
  if (resource.toLowerCase().includes('employee') || resource.toLowerCase().includes('user'))
    return <User size={16} />;
  if (resource.toLowerCase().includes('leave') || resource.toLowerCase().includes('attendance'))
    return <Clock size={16} />;
  if (resource.toLowerCase().includes('document'))
    return <FileText size={16} />;
  return <Shield size={16} />;
}

function getResourceColor(resource: string) {
  if (resource.toLowerCase().includes('employee') || resource.toLowerCase().includes('user'))
    return 'bg-primary/10 text-primary';
  if (resource.toLowerCase().includes('leave'))
    return 'bg-accent-green/10 text-accent-green';
  if (resource.toLowerCase().includes('document'))
    return 'bg-accent-orange/10 text-accent-orange';
  return 'bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark';
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const Compliance: React.FC = () => {
  const { t } = useTranslation(['compliance', 'common']);

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
    show: false, message: '', type: 'success',
  });
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  // Compliance checks
  const { data: checks = [], isLoading: checksLoading } = useComplianceChecks();

  // Audit logs
  const [auditPage, setAuditPage] = useState(1);
  const [auditResource, setAuditResource] = useState('All');
  const { data: auditData, isLoading: auditLoading } = useComplianceAuditLogs({
    page: auditPage,
    limit: 10,
    resource: auditResource,
  });

  // Report builder state
  const [reportName, setReportName] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set(['department']));
  const [dateRange, setDateRange] = useState('last90');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleDataPoint = (key: string) => {
    setSelectedPoints((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Download helper for CSV endpoints
  const downloadCsv = async (url: string, filename: string) => {
    const token = getAuthToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportData = async () => {
    showToast(t('exportData') + '...', 'info');
    try {
      const date = new Date().toISOString().slice(0, 10);
      await downloadCsv(`${BASE_URL}/compliance/export`, `compliance_summary_${date}.csv`);
      showToast(t('exportSuccess'), 'success');
    } catch {
      showToast(t('exportFailed'), 'error');
    }
  };

  const handleGenerateReport = async () => {
    if (!reportName.trim()) {
      showToast(t('reportBuilder.nameRequired'), 'warning');
      return;
    }
    if (selectedPoints.size === 0) {
      showToast(t('reportBuilder.selectAtLeast'), 'warning');
      return;
    }
    setIsGenerating(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/compliance/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          dataPoints: Array.from(selectedPoints),
          dateRange,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('reportBuilder.reportGenerated', { name: reportName }), 'success');
      setReportName('');
    } catch {
      showToast(t('reportBuilder.downloadFailed'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Unique resources for filter dropdown
  const resourceOptions = ['All', 'Employee', 'Leave', 'Document', 'Attendance', 'Auth'];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="flex flex-col">
          <h1 className="text-text-light dark:text-text-dark text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark text-base">{t('subtitle')}</p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-5 py-2.5 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-medium rounded-lg text-sm border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Download size={18} />
          {t('exportData')}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          {/* ===== Compliance Checklist ===== */}
          <section className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-text-light dark:text-text-dark text-xl font-bold tracking-tight">{t('checklist.title')}</h2>
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm mt-1">{t('checklist.subtitle')}</p>
            </div>
            <div className="p-6 space-y-3">
              {checksLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 bg-background-light dark:bg-background-dark/50 rounded-lg animate-pulse" />
                ))
              ) : (
                checks.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-background-dark/50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.status === 'Complete' && <CheckCircle2 className="text-accent-green flex-shrink-0" size={20} />}
                      {item.status === 'In Progress' && <Clock className="text-accent-orange flex-shrink-0" size={20} />}
                      {item.status === 'Overdue' && <AlertCircle className="text-accent-red flex-shrink-0" size={20} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-text-light dark:text-text-dark font-medium text-sm">{t(item.titleKey)}</p>
                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.status === 'Complete' ? 'bg-accent-green' :
                                item.status === 'In Progress' ? 'bg-accent-orange' : 'bg-accent-red'
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">
                            {item.detail}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ml-3 whitespace-nowrap ${
                      item.status === 'Complete' ? 'text-accent-green bg-accent-green/10' :
                      item.status === 'In Progress' ? 'text-accent-orange bg-accent-orange/10' :
                      'text-accent-red bg-accent-red/10'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ===== HR Audit Log ===== */}
          <section className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-text-light dark:text-text-dark text-xl font-bold tracking-tight">{t('auditLog.title')}</h2>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm mt-1">{t('auditLog.subtitle')}</p>
              </div>
              <Dropdown
                value={auditResource}
                onChange={(val) => { setAuditResource(val); setAuditPage(1); }}
                options={resourceOptions.map((opt) => ({
                  value: opt,
                  label: opt === 'All' ? t('auditLog.filterAll') : opt,
                }))}
                width="w-44"
              />
            </div>
            <div className="p-6 space-y-4">
              {auditLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-background-light dark:bg-background-dark/50 rounded-lg animate-pulse" />
                ))
              ) : !auditData?.data?.length ? (
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark text-center py-6">{t('auditLog.noLogs')}</p>
              ) : (
                auditData.data.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className={`rounded-full p-2 flex-shrink-0 ${getResourceColor(log.resource)}`}>
                      {getResourceIcon(log.resource)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-light dark:text-text-dark text-sm leading-snug">
                        <span className="font-semibold">{log.userEmail || 'System'}</span>
                        {' '}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          log.action === 'Created' ? 'bg-accent-green/10 text-accent-green' :
                          log.action === 'Updated' ? 'bg-primary/10 text-primary' :
                          log.action === 'Deleted' ? 'bg-accent-red/10 text-accent-red' :
                          'bg-gray-100 dark:bg-gray-700 text-text-muted-light dark:text-text-muted-dark'
                        }`}>
                          {log.action}
                        </span>
                        {' '}
                        <span className="text-text-muted-light dark:text-text-muted-dark">{log.resource}</span>
                      </p>
                      <p className="text-text-muted-light dark:text-text-muted-dark text-xs mt-0.5">
                        {log.method} {log.path} · {formatTimeAgo(log.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      log.success ? 'text-accent-green bg-accent-green/10' : 'text-accent-red bg-accent-red/10'
                    }`}>
                      {log.statusCode}
                    </span>
                  </div>
                ))
              )}

              {/* Pagination */}
              {auditData && auditData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border-light dark:border-border-dark">
                  <button
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    disabled={auditPage <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={14} /> {t('auditLog.previous')}
                  </button>
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                    {t('auditLog.page', { current: auditPage, total: auditData.totalPages })}
                  </span>
                  <button
                    onClick={() => setAuditPage((p) => Math.min(auditData.totalPages, p + 1))}
                    disabled={auditPage >= auditData.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-background-dark disabled:opacity-40 transition-colors"
                  >
                    {t('auditLog.next')} <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ===== Custom Report Builder ===== */}
        <div className="flex flex-col">
          <section className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark h-full">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-text-light dark:text-text-dark text-xl font-bold tracking-tight">{t('reportBuilder.title')}</h2>
              <p className="text-text-muted-light dark:text-text-muted-dark text-sm mt-1">{t('reportBuilder.subtitle')}</p>
            </div>
            <div className="p-6 flex flex-col">
              <div className="space-y-6 flex-grow">
                {/* Report Name */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2" htmlFor="report-name">
                    {t('reportBuilder.reportName')}
                  </label>
                  <input
                    className="w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary"
                    id="report-name"
                    placeholder={t('reportBuilder.reportPlaceholder')}
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>

                {/* Data Points */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                    {t('reportBuilder.dataPoints')}
                  </label>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark mb-3">
                    {t('reportBuilder.employeeName')} ({t('common:status.always')})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {DATA_POINTS.map((point) => {
                      const checked = selectedPoints.has(point.key);
                      return (
                        <button
                          key={point.key}
                          type="button"
                          onClick={() => toggleDataPoint(point.key)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <span
                            className={`flex items-center justify-center w-[18px] h-[18px] rounded border-2 transition-all flex-shrink-0 ${
                              checked
                                ? 'bg-primary border-primary'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-primary/60'
                            }`}
                          >
                            {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                          </span>
                          <span className="text-text-light dark:text-text-dark text-sm">{t(point.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2" htmlFor="date-range">
                    {t('reportBuilder.dateRange')}
                  </label>
                  <Dropdown
                    value={dateRange}
                    onChange={setDateRange}
                    options={DATE_RANGES.map((range) => ({
                      value: range.value,
                      label: t(range.labelKey),
                    }))}
                    id="date-range"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8">
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-medium rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileEdit size={18} />
                  {isGenerating ? t('reportBuilder.generating') : t('reportBuilder.generateReport')}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
};
