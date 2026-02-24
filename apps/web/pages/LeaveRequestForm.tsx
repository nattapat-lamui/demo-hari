import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  useLeaveBalance,
  useAddLeaveRequestWithFile,
  useEditLeaveRequest,
  useLeaveRequestById,
  useEmployeeSearch,
  useLeaveRequests,
  useLeaveTypeConfig,
} from '../hooks/queries';
import { resolveAvatarUrl } from '../lib/api';
import { Dropdown } from '../components/Dropdown';
import { DatePicker } from '../components/DatePicker';
import { FileUpload } from '../components/FileUpload';
import { SearchableSelect } from '../components/SearchableSelect';
import type { SearchableSelectOption } from '../components/SearchableSelect';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { LeaveBalance } from '../types';
import { buildLeaveOptions, requiresMedicalCert, getLeaveColor } from '../lib/leaveTypeConfig';

interface FormState {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  handoverEmployeeId: string;
  handoverNotes: string;
  medicalCertificate: File | null;
}

const initialForm: FormState = {
  type: 'Vacation',
  startDate: '',
  endDate: '',
  reason: '',
  handoverEmployeeId: '',
  handoverNotes: '',
  medicalCertificate: null,
};

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-500',
  Approved: 'bg-green-500',
  Rejected: 'bg-red-500',
  'Cancel Requested': 'bg-orange-500',
};

export function LeaveRequestForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState<FormState>(initialForm);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Queries
  const { data: leaveConfigs = [] } = useLeaveTypeConfig();
  const LEAVE_OPTIONS = useMemo(() => buildLeaveOptions(leaveConfigs), [leaveConfigs]);
  const { data: balances = [], isPending: balanceLoading } = useLeaveBalance(user?.employeeId);
  const { data: existingRequest, isPending: requestLoading } = useLeaveRequestById(id);
  const { data: leaveRequests = [], isPending: requestsLoading } = useLeaveRequests();
  const { data: employees = [], isPending: isSearching } = useEmployeeSearch(employeeSearch);

  // Mutations
  const addLeaveRequest = useAddLeaveRequestWithFile();
  const editLeaveRequest = useEditLeaveRequest();

  // Sync default type with first available config
  useEffect(() => {
    if (!isEditMode && leaveConfigs.length > 0 && !leaveConfigs.some((c) => c.type === form.type)) {
      setForm((p) => ({ ...p, type: leaveConfigs[0]!.type }));
    }
  }, [leaveConfigs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && existingRequest) {
      // Ensure dates are YYYY-MM-DD for the DatePicker
      const toDateStr = (d: string) => (d ? d.split('T')[0] ?? d : '');
      setForm({
        type: existingRequest.type,
        startDate: toDateStr(existingRequest.startDate),
        endDate: toDateStr(existingRequest.endDate),
        reason: existingRequest.reason || '',
        handoverEmployeeId: existingRequest.handoverEmployeeId || '',
        handoverNotes: existingRequest.handoverNotes || '',
        medicalCertificate: null,
      });
    }
  }, [isEditMode, existingRequest]);

  // Calculate duration
  const dayCount = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.startDate, form.endDate]);

  // Get current balance for selected type
  const currentBalance: LeaveBalance | undefined = useMemo(
    () => balances.find((b) => b.type === form.type),
    [balances, form.type],
  );

  const isUnlimited = !currentBalance || currentBalance.total === -1;
  const remaining = currentBalance?.remaining ?? 0;
  const quotaExceeded = !isUnlimited && dayCount > 0 && dayCount > remaining;
  const needsMedicalCert = requiresMedicalCert(form.type, dayCount);

  // Employee options for SearchableSelect
  const employeeOptions: SearchableSelectOption[] = useMemo(
    () =>
      employees.map((e) => ({
        value: e.id,
        label: e.name,
        avatar: resolveAvatarUrl(e.avatar, e.name),
        subtitle: e.department,
      })),
    [employees],
  );

  const handleEmployeeSearch = useCallback((q: string) => {
    setEmployeeSearch(q);
  }, []);

  // My recent requests (last 5)
  const recentRequests = useMemo(() => {
    if (!leaveRequests.length || !user?.employeeId) return [];
    return leaveRequests
      .filter((r) => r.employeeId === user.employeeId)
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
      .slice(0, 5);
  }, [leaveRequests, user?.employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      showToast('End date must be after start date', 'error');
      return;
    }
    if (quotaExceeded) {
      showToast(`Insufficient balance. You have ${remaining} day(s) remaining.`, 'error');
      return;
    }
    if (needsMedicalCert && !form.medicalCertificate && !isEditMode) {
      showToast(
        form.type === 'Maternity Leave'
          ? 'Medical certificate required for maternity leave'
          : 'Medical certificate required for sick leave of 3+ days',
        'error',
      );
      return;
    }

    const formData = new FormData();
    if (!isEditMode) {
      formData.append('employeeId', user?.employeeId || '');
    }
    formData.append('type', form.type);
    formData.append('startDate', form.startDate);
    formData.append('endDate', form.endDate);
    if (form.reason) formData.append('reason', form.reason);
    if (form.handoverEmployeeId) formData.append('handoverEmployeeId', form.handoverEmployeeId);
    if (form.handoverNotes) formData.append('handoverNotes', form.handoverNotes);
    if (form.medicalCertificate) formData.append('medicalCertificate', form.medicalCertificate);

    try {
      if (isEditMode) {
        await editLeaveRequest.mutateAsync({ id: id!, formData });
        showToast('Leave request updated successfully', 'success');
      } else {
        await addLeaveRequest.mutateAsync(formData);
        showToast('Leave request submitted successfully', 'success');
      }
      navigate('/time-off');
    } catch (error: any) {
      showToast(error?.message || 'Failed to submit leave request', 'error');
    }
  };

  if (balanceLoading || (isEditMode && requestLoading)) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-6">
              {isEditMode ? 'Edit Leave Request' : 'New Leave Request'}
            </h2>

            {/* Warning for editing approved request */}
            {isEditMode && existingRequest?.status === 'Approved' && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  Editing an approved request will reset its status to Pending and require re-approval.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  options={LEAVE_OPTIONS}
                  value={form.type}
                  onChange={(value) => setForm((prev) => ({
                    ...prev,
                    type: value,
                    medicalCertificate: (value !== 'Sick Leave' && value !== 'Maternity Leave') ? null : prev.medicalCertificate,
                  }))}
                  placeholder="Select leave type"
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={form.startDate}
                    onChange={(value) => setForm({ ...form, startDate: value })}
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={form.endDate}
                    onChange={(value) => setForm({ ...form, endDate: value })}
                    minDate={form.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Total Duration + Quota */}
              {dayCount > 0 && (
                <div className="w-full max-w-full overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-text-light dark:text-text-dark shrink-0">
                      Total Duration:
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shrink-0 ${
                        quotaExceeded
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                      }`}
                    >
                      {dayCount} {dayCount === 1 ? 'Day' : 'Days'}
                    </span>
                    {quotaExceeded && (
                      <span className="text-sm text-red-600 dark:text-red-400 min-w-0 break-words">
                        Exceeds available balance
                      </span>
                    )}
                  </div>

                  {/* Quota bar */}
                  {currentBalance && !isUnlimited && (
                    <div className="min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted-light dark:text-text-muted-dark">
                          Available: {remaining} / {currentBalance.total} days
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quotaExceeded
                              ? 'bg-red-500'
                              : remaining / currentBalance.total < 0.3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((remaining / currentBalance.total) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                  Reason
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Provide a reason for your leave request..."
                />
                <div className="text-right text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                  {form.reason.length} / 500
                </div>
              </div>

              {/* Medical Certificate */}
              {needsMedicalCert && (
                <div>
                  <FileUpload
                    value={form.medicalCertificate}
                    onChange={(file) => setForm({ ...form, medicalCertificate: file })}
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSizeMB={10}
                    label="Medical Certificate"
                    required
                  />
                  {isEditMode && existingRequest?.medicalCertificatePath && !form.medicalCertificate && (
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                      A certificate was previously uploaded. Upload a new one only if you want to replace it.
                    </p>
                  )}
                </div>
              )}

              {/* Handover Person */}
              <div>
                <SearchableSelect
                  value={form.handoverEmployeeId}
                  onChange={(value) => setForm({ ...form, handoverEmployeeId: value })}
                  options={employeeOptions}
                  onSearch={handleEmployeeSearch}
                  isLoading={isSearching}
                  placeholder="Search employee..."
                  label="Handover Person"
                  excludeValues={user?.employeeId ? [user.employeeId] : []}
                />
              </div>

              {/* Handover Notes */}
              {form.handoverEmployeeId && (
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                    Handover Notes
                  </label>
                  <textarea
                    value={form.handoverNotes}
                    onChange={(e) => setForm({ ...form, handoverNotes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Provide handover instructions..."
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  type="button"
                  onClick={() => navigate('/time-off')}
                  className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-text-light dark:text-text-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLeaveRequest.isPending || editLeaveRequest.isPending || quotaExceeded}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLeaveRequest.isPending || editLeaveRequest.isPending
                    ? 'Submitting...'
                    : isEditMode
                    ? 'Update Request'
                    : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Current Balance Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
              Current Balance
            </h3>
            {balances.length > 0 ? (
              <div className="space-y-4">
                {balances.map((bal) => {
                  const isUnlimitedBal = bal.total === -1;
                  const pct = isUnlimitedBal
                    ? 100
                    : bal.total > 0
                    ? Math.min((bal.remaining / bal.total) * 100, 100)
                    : 0;
                  const colorClass = getLeaveColor(bal.type, leaveConfigs).barFill;

                  return (
                    <div key={bal.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-light dark:text-text-dark">{bal.type}</span>
                        <span className="font-medium text-text-light dark:text-text-dark">
                          {isUnlimitedBal ? 'Unlimited' : `${bal.remaining} / ${bal.total}`}
                        </span>
                      </div>
                      {!isUnlimitedBal && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${colorClass} h-2 rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                No balance data available
              </p>
            )}
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-4">
              Balances update automatically when leave requests are approved.
            </p>
          </div>

          {/* Recent Requests Card */}
          <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">
              Recent Requests
            </h3>
            {requestsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        STATUS_COLORS[req.status] || 'bg-gray-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                        {req.type}
                      </p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                        {req.dates}
                      </p>
                      <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                        {req.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                No recent requests
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
