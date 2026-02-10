import React, { useState } from 'react';
import { Modal } from './Modal';
import { Dropdown } from './Dropdown';
import { DatePicker } from './DatePicker';

interface RequestTimeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; startDate: string; endDate: string; reason: string }) => Promise<void>;
  isPending?: boolean;
}

const LEAVE_OPTIONS = [
  { value: 'Vacation', label: 'Vacation' },
  { value: 'Sick Leave', label: 'Sick Leave' },
];

const initialForm = { type: 'Vacation', startDate: '', endDate: '', reason: '' };

export const RequestTimeOffModal: React.FC<RequestTimeOffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const handleClose = () => {
    setForm(initialForm);
    setError('');
    onClose();
  };

  const dayCount = (() => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  })();

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
    try {
      await onSubmit(form);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit leave request.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Time Off">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Type</label>
          <Dropdown
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value })}
            options={LEAVE_OPTIONS}
            placeholder="Select leave type"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="Start Date"
            value={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
            placeholder="Select start date"
          />
          <DatePicker
            label="End Date"
            value={form.endDate}
            onChange={(date) => setForm({ ...form, endDate: date })}
            placeholder="Select end date"
            minDate={form.startDate}
          />
        </div>

        {dayCount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-lg px-3 py-2 font-medium">
            {dayCount} day{dayCount !== 1 ? 's' : ''} requested
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Reason</label>
          <textarea
            rows={3}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm resize-none text-text-light dark:text-text-dark"
            placeholder="Optional reason for leave"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-text-muted-light hover:text-text-light dark:hover:text-text-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
