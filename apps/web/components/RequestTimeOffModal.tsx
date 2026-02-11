import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from './Modal';
import { Dropdown } from './Dropdown';
import { DatePicker } from './DatePicker';
import { FileUpload } from './FileUpload';
import { SearchableSelect } from './SearchableSelect';
import type { SearchableSelectOption } from './SearchableSelect';
import { useLeaveBalance, useEmployeeSearch } from '../hooks/queries';
import { resolveAvatarUrl } from '../lib/api';
import type { LeaveBalance } from '../types';

interface RequestTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  isPending?: boolean;
  employeeId: string;
}

const LEAVE_OPTIONS = [
  { value: 'Vacation', label: 'Vacation' },
  { value: 'Sick Leave', label: 'Sick Leave' },
  { value: 'Personal Day', label: 'Personal Day' },
];

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

export const RequestTimeOffModal: React.FC<RequestTimeOffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
  employeeId,
}) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Queries
  const { data: balances = [] } = useLeaveBalance(employeeId);
  const { data: employees = [], isPending: isSearching } = useEmployeeSearch(employeeSearch);

  // Derived state
  const dayCount = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.startDate, form.endDate]);

  const currentBalance: LeaveBalance | undefined = useMemo(
    () => balances.find((b) => b.type === form.type),
    [balances, form.type],
  );

  const isUnlimited = !currentBalance || currentBalance.total === -1;
  const remaining = currentBalance?.remaining ?? 0;
  const quotaExceeded = !isUnlimited && dayCount > 0 && dayCount > remaining;

  const needsMedicalCert = form.type === 'Sick Leave' && dayCount >= 3;
  const showHandoverNotes = !!form.handoverEmployeeId;

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

  // Handlers
  const handleClose = () => {
    setForm(initialForm);
    setError('');
    setEmployeeSearch('');
    onClose();
  };

  const handleTypeChange = (type: string) => {
    setForm((prev) => ({
      ...prev,
      type,
      // Clear medical cert when switching away from Sick Leave
      medicalCertificate: type !== 'Sick Leave' ? null : prev.medicalCertificate,
    }));
  };

  const handleEmployeeSearch = useCallback((q: string) => {
    setEmployeeSearch(q);
  }, []);

  const handleSubmit = async () => {
    setError('');

    if (!form.startDate || !form.endDate) {
      setError('Please select both start and end dates.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date must be after start date.');
      return;
    }
    if (quotaExceeded) {
      setError(`Insufficient balance. You have ${remaining} day(s) remaining.`);
      return;
    }
    if (needsMedicalCert && !form.medicalCertificate) {
      setError('A medical certificate is required for sick leave of 3+ days.');
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', employeeId);
    formData.append('type', form.type);
    formData.append('startDate', form.startDate);
    formData.append('endDate', form.endDate);
    if (form.reason) formData.append('reason', form.reason);
    if (form.handoverEmployeeId) formData.append('handoverEmployeeId', form.handoverEmployeeId);
    if (form.handoverNotes) formData.append('handoverNotes', form.handoverNotes);
    if (form.medicalCertificate) formData.append('medicalCertificate', form.medicalCertificate);

    try {
      await onSubmit(formData);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit leave request.');
    }
  };

  // Quota bar
  const quotaPercent = !isUnlimited && currentBalance
    ? Math.min(100, Math.round(((currentBalance.total - remaining) / currentBalance.total) * 100))
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Time Off" maxWidth="lg">
      <div className="p-6 space-y-4">
        {/* 1. Leave Type */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Type</label>
          <Dropdown
            value={form.type}
            onChange={handleTypeChange}
            options={LEAVE_OPTIONS}
            placeholder="Select leave type"
          />
        </div>

        {/* 2. Date pickers + day count badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={form.startDate}
            onChange={(date) => setForm((p) => ({ ...p, startDate: date }))}
            placeholder="Select start date"
          />
          <DatePicker
            label="End Date"
            value={form.endDate}
            onChange={(date) => setForm((p) => ({ ...p, endDate: date }))}
            placeholder="Select end date"
            minDate={form.startDate}
          />
        </div>

        {dayCount > 0 && (
          <div className={`text-sm rounded-lg px-3 py-2 font-medium ${
            quotaExceeded
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}>
            {dayCount} day{dayCount !== 1 ? 's' : ''} requested
            {quotaExceeded && ` — exceeds remaining balance (${remaining})`}
          </div>
        )}

        {/* 3. Quota balance indicator */}
        {!isUnlimited && currentBalance && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted-light dark:text-text-muted-dark">
                {form.type} Balance
              </span>
              <span className={`font-medium ${
                remaining <= 0 ? 'text-red-600 dark:text-red-400' : 'text-text-light dark:text-text-dark'
              }`}>
                {remaining} of {currentBalance.total} remaining
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  quotaExceeded ? 'bg-red-500' :
                  quotaPercent > 75 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* 4. Reason */}
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Reason</label>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm resize-none text-text-light dark:text-text-dark"
            placeholder="Optional reason for leave"
          />
        </div>

        {/* 5. Medical Certificate — conditional: Sick Leave >= 3 days */}
        {needsMedicalCert && (
          <FileUpload
            label="Medical Certificate"
            value={form.medicalCertificate}
            onChange={(file) => setForm((p) => ({ ...p, medicalCertificate: file }))}
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeMB={10}
            required
            error={!form.medicalCertificate && error.includes('medical') ? error : undefined}
          />
        )}

        {/* 6. Handover Person — optional */}
        <SearchableSelect
          label="Handover Person"
          value={form.handoverEmployeeId}
          onChange={(val) => setForm((p) => ({ ...p, handoverEmployeeId: val, handoverNotes: val ? p.handoverNotes : '' }))}
          options={employeeOptions}
          onSearch={handleEmployeeSearch}
          isLoading={isSearching}
          placeholder="Select handover person (optional)"
          excludeValues={[employeeId]}
        />

        {/* 7. Handover Notes — conditional: only when handover person selected */}
        {showHandoverNotes && (
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Handover Notes</label>
            <textarea
              rows={3}
              value={form.handoverNotes}
              onChange={(e) => setForm((p) => ({ ...p, handoverNotes: e.target.value }))}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm resize-none text-text-light dark:text-text-dark"
              placeholder="Describe tasks to hand over..."
              maxLength={2000}
            />
          </div>
        )}

        {/* Error message */}
        {error && !error.includes('medical') && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-text-muted-light hover:text-text-light dark:hover:text-text-dark transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || quotaExceeded}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
