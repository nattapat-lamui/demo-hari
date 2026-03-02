import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Dropdown, DropdownOption } from './Dropdown';
import { DatePicker } from './DatePicker';
import { dayjs } from '../lib/date';
import type { AdminAttendanceRecord, AttendanceStatus, Employee } from '../types';

interface UpsertAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status?: AttendanceStatus;
    notes?: string;
  }) => void;
  employees: Employee[];
  editingRecord?: AdminAttendanceRecord | null;
  isPending?: boolean;
}

/* STATUS_OPTIONS moved inside component for i18n */

export const UpsertAttendanceModal: React.FC<UpsertAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  editingRecord,
  isPending = false,
}) => {
  const { t } = useTranslation(['attendance', 'common']);

  const STATUS_OPTIONS: DropdownOption[] = [
    { value: 'Absent', label: t('common:status.absent') },
    { value: 'On-leave', label: t('common:status.onLeave') },
  ];

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('Absent');
  const [notes, setNotes] = useState('');

  const isEditing = !!editingRecord;

  useEffect(() => {
    if (editingRecord) {
      setEmployeeId(editingRecord.employeeId);
      setDate(editingRecord.date);
      setClockIn(editingRecord.clockIn ? extractTime(editingRecord.clockIn) : '');
      setClockOut(editingRecord.clockOut ? extractTime(editingRecord.clockOut) : '');
      setStatus(editingRecord.status);
      setNotes(editingRecord.notes || '');
    } else {
      setEmployeeId('');
      setDate('');
      setClockIn('');
      setClockOut('');
      setStatus('Absent');
      setNotes('');
    }
  }, [editingRecord, isOpen]);

  const extractTime = (dateTimeStr: string): string => {
    return dayjs(dateTimeStr).tz('Asia/Bangkok').format('HH:mm');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date) return;

    const dateStr = date.slice(0, 10); // Normalize to YYYY-MM-DD
    onSubmit({
      employeeId,
      date: dateStr,
      clockIn: clockIn ? `${dateStr}T${clockIn}:00+07:00` : undefined,
      clockOut: clockOut ? `${dateStr}T${clockOut}:00+07:00` : undefined,
      // Only send status when no clock times (manual absence/leave entry)
      status: clockIn ? undefined : status,
      notes: notes || undefined,
    });
  };

  const employeeOptions: DropdownOption[] = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('attendance:upsertModal.editTitle') : t('attendance:upsertModal.addTitle')} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Employee */}
        <div>
          <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
            {t('attendance:upsertModal.employee')}
          </label>
          {isEditing ? (
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark">
              {editingRecord?.employeeName}
            </div>
          ) : (
            <Dropdown
              options={employeeOptions}
              value={employeeId}
              onChange={setEmployeeId}
              placeholder={t('attendance:upsertModal.selectEmployee')}
              width="w-full"
            />
          )}
        </div>

        {/* Date */}
        <div>
          <DatePicker value={date} onChange={setDate} label={t('attendance:upsertModal.date')} placeholder={t('attendance:upsertModal.selectDate')} />
        </div>

        {/* Clock In / Clock Out */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
              {t('attendance:upsertModal.clockIn')}
            </label>
            <input
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
              {t('attendance:upsertModal.clockOut')}
            </label>
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Status — only show when no clock-in (manual absence/leave entry) */}
        {!clockIn && (
          <div>
            <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
              {t('attendance:upsertModal.status')}
            </label>
            <Dropdown
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v as AttendanceStatus)}
              width="w-full"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
            {t('attendance:upsertModal.notes')} <span className="font-normal text-text-muted-light dark:text-text-muted-dark">{t('attendance:upsertModal.optional')}</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t('attendance:upsertModal.optionalNotes')}
            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark placeholder:text-text-muted-light/50 dark:placeholder:text-text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('attendance:upsertModal.cancel')}
          </button>
          <button
            type="submit"
            disabled={!employeeId || !date || isPending}
            className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? t('attendance:upsertModal.saving') : isEditing ? t('attendance:upsertModal.saveChanges') : t('attendance:upsertModal.addRecord')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
