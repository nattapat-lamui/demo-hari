import React, { useState } from 'react';
import { Modal } from './Modal';

interface RejectReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  employeeName?: string;
}

export const RejectReasonDialog: React.FC<RejectReasonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Leave Request" maxWidth="sm">
      <div className="p-6 space-y-4">
        {employeeName && (
          <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Please provide a reason for rejecting <span className="font-medium text-text-light dark:text-text-dark">{employeeName}</span>'s leave request.
          </p>
        )}
        <div>
          <label htmlFor="rejectReason" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1.5">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejectReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
            rows={3}
            className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark placeholder:text-text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-colors"
            autoFocus
          />
        </div>
      </div>
      <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!reason.trim()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Reject
        </button>
      </div>
    </Modal>
  );
};
