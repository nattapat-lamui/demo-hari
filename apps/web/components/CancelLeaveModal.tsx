import { useTranslation } from 'react-i18next';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import type { LeaveRequest } from '../types';
import { translateLeaveType } from '../lib/leaveTypeConfig';

interface CancelLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  request: LeaveRequest | null;
  isPending?: boolean;
}

export function CancelLeaveModal({
  isOpen,
  onClose,
  onConfirm,
  request,
  isPending = false,
}: CancelLeaveModalProps) {
  const { t } = useTranslation(['leave', 'common']);
  if (!request) return null;

  const days = request.days ?? 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('leave:cancelModal.title')} maxWidth="sm">
      <div className="p-6 space-y-4">
        {/* Leave Details */}
        <div className="bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-light dark:text-text-dark">
                {translateLeaveType(request.type)}
              </p>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
                {request.dates}
              </p>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                {days} {days === 1 ? t('common:time.day') : t('common:time.days')}
              </p>
            </div>
          </div>
        </div>

        {/* Warning for Approved Requests */}
        {request.status === 'Approved' && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-200">
                {t('leave:cancelModal.approvedWarning')}
              </p>
            </div>
          </div>
        )}

        {/* Confirmation Message */}
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
          {t('leave:cancelModal.confirmMessage')}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('leave:cancelModal.keepLeave')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? t('leave:cancelModal.cancelling') : t('leave:cancelModal.cancelLeave')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
