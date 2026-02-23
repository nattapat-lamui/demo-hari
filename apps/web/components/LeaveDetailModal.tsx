import React from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Users,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { LeaveActionBar } from './LeaveActionBar';
import { useLeaveBalance } from '../hooks/queries';
import { API_HOST } from '../lib/api';
import type { LeaveRequest } from '../types';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LeaveRequest | null;
  onApprove: (id: string) => void | Promise<void>;
  onReject: (request: LeaveRequest, reason: string) => void | Promise<void>;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
}) => {
  const isSensitiveHidden = request?.type === 'Leave';
  const { data: balances = [] } = useLeaveBalance(request?.employeeId);

  if (!request) return null;

  const days = request.days ?? 1;
  const balance = isSensitiveHidden ? undefined : balances.find((b) => b.type === request.type);
  const hasMedicalCert = !!request.medicalCertificatePath;
  const hasHandover = !!request.handoverEmployeeName || !!request.handoverNotes;
  const isPending = request.status === 'Pending';

  const certUrl = request.medicalCertificatePath?.startsWith('/')
    ? `${API_HOST}${request.medicalCertificatePath}`
    : request.medicalCertificatePath;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leave Request Details" maxWidth="lg">
      <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">
        {/* Employee info */}
        <div className="flex items-center gap-4">
          <Avatar src={request.avatar} name={request.employeeName} size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
              {request.employeeName}
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                request.status === 'Approved'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : request.status === 'Rejected'
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
              }`}
            >
              {request.status === 'Approved' && <CheckCircle2 size={12} />}
              {request.status === 'Rejected' && <XCircle size={12} />}
              {request.status === 'Pending' && <Clock size={12} />}
              {request.status}
            </span>
          </div>
        </div>

        {/* Leave details grid */}
        <div className="grid grid-cols-2 gap-4">
          <DetailItem
            icon={<Calendar size={16} />}
            label="Leave Type"
            value={request.type}
          />
          <DetailItem
            icon={<Calendar size={16} />}
            label="Date Range"
            value={request.dates}
          />
          <DetailItem
            icon={<Clock size={16} />}
            label="Duration"
            value={`${days} day${days !== 1 ? 's' : ''}`}
          />
          {balance && (
            <DetailItem
              icon={<FileText size={16} />}
              label="Total Days Used"
              value={
                balance.total === -1
                  ? `${balance.used} used (unlimited)`
                  : `${balance.used}/${balance.total} used (${balance.remaining} left)`
              }
            />
          )}
        </div>

        {/* Reason */}
        {request.reason && (
          <div>
            <h4 className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark mb-1">
              Reason
            </h4>
            <p className="text-sm text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark rounded-lg p-3 border border-border-light dark:border-border-dark">
              {request.reason}
            </p>
          </div>
        )}

        {/* Handover section */}
        {hasHandover && (
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Handover Information
              </h4>
            </div>
            {request.handoverEmployeeName && (
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">Substitute:</span> {request.handoverEmployeeName}
              </p>
            )}
            {request.handoverNotes && (
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                <span className="font-medium">Notes:</span> {request.handoverNotes}
              </p>
            )}
          </div>
        )}

        {/* Medical certificate */}
        {hasMedicalCert && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <FileText size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Medical Certificate Attached
              </p>
            </div>
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline shrink-0"
            >
              <Download size={14} />
              Download
            </a>
          </div>
        )}

        {/* Rejection reason (if rejected) */}
        {request.status === 'Rejected' && request.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
              Rejection Reason
            </h4>
            <p className="text-sm text-red-800 dark:text-red-300">
              {request.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      {isPending ? (
        <LeaveActionBar
          employeeName={request.employeeName}
          onApprove={() => onApprove(request.id)}
          onReject={(reason) => onReject(request, reason)}
          sticky={true}
        />
      ) : (
        <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </Modal>
  );
};

// Small helper component
const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 text-text-muted-light dark:text-text-muted-dark">{icon}</span>
    <div>
      <p className="text-xs text-text-muted-light dark:text-text-muted-dark">{label}</p>
      <p className="text-sm font-medium text-text-light dark:text-text-dark">{value}</p>
    </div>
  </div>
);
