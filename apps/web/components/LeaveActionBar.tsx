import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { RejectReasonDialog } from './RejectReasonDialog';

interface LeaveActionBarProps {
  /** Employee name for context in reject dialog */
  employeeName?: string;
  /** Callback when approve is clicked */
  onApprove: () => void | Promise<void>;
  /** Callback when reject is confirmed with reason */
  onReject: (reason: string) => void | Promise<void>;
  /** Whether the action bar should stick to bottom on mobile */
  sticky?: boolean;
  /** Compact mode for inline usage (e.g., in table rows) */
  compact?: boolean;
  /** Custom className for additional styling */
  className?: string;
  /** Disable all actions */
  disabled?: boolean;
}

export const LeaveActionBar: React.FC<LeaveActionBarProps> = ({
  employeeName,
  onApprove,
  onReject,
  sticky = false,
  compact = false,
  className = '',
  disabled = false,
}) => {
  const { t } = useTranslation(['leave']);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleApprove = async () => {
    if (disabled || isApproving) return;

    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = () => {
    if (disabled) return;
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (reason: string) => {
    setIsRejectDialogOpen(false);
    await onReject(reason);
  };

  return (
    <>
      <div
        className={`
          flex items-center gap-3
          ${compact ? 'justify-start' : 'justify-end px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50'}
          ${sticky ? 'md:static fixed bottom-0 left-0 right-0 z-30 shadow-lg md:shadow-none' : ''}
          ${className}
        `}
      >
        {/* Reject Button - Secondary (Left) */}
        <button
          onClick={handleRejectClick}
          disabled={disabled || isApproving}
          aria-label={t('leave:actionBar.rejectRequest')}
          className={`
            group
            ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}
            font-medium
            text-gray-700 dark:text-gray-300
            bg-white dark:bg-card-dark
            border border-gray-300 dark:border-gray-600
            rounded-lg
            hover:bg-gray-50 dark:hover:bg-gray-700
            hover:border-gray-400 dark:hover:border-gray-500
            active:bg-gray-100 dark:active:bg-gray-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900
            flex items-center gap-1.5
          `}
        >
          <XCircle
            className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform duration-200 group-hover:scale-110`}
          />
          {t('leave:actionBar.reject')}
        </button>

        {/* Approve Button - Primary (Right) */}
        <button
          onClick={handleApprove}
          disabled={disabled || isApproving}
          aria-label={t('leave:actionBar.approveRequest')}
          className={`
            group
            ${compact ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}
            font-medium
            text-white
            bg-green-600 dark:bg-green-700
            border border-transparent
            rounded-lg
            hover:bg-green-700 dark:hover:bg-green-600
            active:bg-green-800 dark:active:bg-green-500
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
            flex items-center gap-1.5
            shadow-sm hover:shadow-md
          `}
        >
          {isApproving ? (
            <>
              <Loader2 className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
              {t('leave:actionBar.approving')}
            </>
          ) : (
            <>
              <CheckCircle2
                className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} transition-transform duration-200 group-hover:scale-110`}
              />
              {t('leave:actionBar.approve')}
            </>
          )}
        </button>
      </div>

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        employeeName={employeeName}
      />
    </>
  );
};
