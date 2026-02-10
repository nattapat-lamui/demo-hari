import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Dropdown, DropdownOption } from './Dropdown';
import { DatePicker } from './DatePicker';
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

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'On-time', label: 'On-time' },
  { value: 'Late', label: 'Late' },
  { value: 'Absent', label: 'Absent' },
  { value: 'On-leave', label: 'On-leave' },
];

export const UpsertAttendanceModal: React.FC<UpsertAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  editingRecord,
  isPending = false,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('On-time');
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
      setStatus('On-time');
      setNotes('');
    }
  }, [editingRecord, isOpen]);

  const extractTime = (dateTimeStr: string): string => {
    const d = new Date(dateTimeStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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
      status,
      notes: notes || undefined,
    });
  };

  const employeeOptions: DropdownOption[] = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Attendance Record' : 'Add Attendance Record'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Employee */}
        <div>
          <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
            Employee
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
              placeholder="Select employee"
              width="w-full"
            />
          )}
        </div>

        {/* Date */}
        <div>
          <DatePicker value={date} onChange={setDate} label="Date" placeholder="Select date" />
        </div>

        {/* Clock In / Clock Out */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
              Clock In
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
              Clock Out
            </label>
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
            Status
          </label>
          <Dropdown
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => setStatus(v as AttendanceStatus)}
            width="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-text-light dark:text-text-dark mb-1 block">
            Notes <span className="font-normal text-text-muted-light dark:text-text-muted-dark">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={!employeeId || !date || isPending}
            className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Record'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
