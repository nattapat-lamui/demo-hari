import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, Plus, CheckCircle2, XCircle, Building2, Briefcase, IdCard, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLeaveRequests, useLeaveBalance, useEmployeeDetail, useCancelLeaveRequest } from '../hooks/queries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LeaveCalendar } from '../components/LeaveCalendar';
import { CancelLeaveModal } from '../components/CancelLeaveModal';
import type { LeaveBalance, LeaveRequest } from '../types';

// ---------------------------------------------------------------------------
// Circular Progress Ring
// ---------------------------------------------------------------------------
const ProgressRing: React.FC<{
  remaining: number;
  total: number;
  color: string;
}> = ({ remaining, total, color }) => {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min(Math.max(remaining, 0) / total, 1) : 0;
  const offset = circumference * (1 - percent);

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth="7"
        />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-light dark:text-text-dark">
          {Math.max(remaining, 0)}
        </span>
        <span className="text-[10px] font-semibold tracking-widest text-text-muted-light dark:text-text-muted-dark uppercase">
          left
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Leave Balance Card config
// ---------------------------------------------------------------------------
interface CardConfig {
  type: string;
  label: string;
  color: string;
  borderColor: string;
}

const LEAVE_CARDS: CardConfig[] = [
  { type: 'Vacation',      label: 'Annual Leave',    color: '#3B82F6', borderColor: 'border-l-blue-500' },
  { type: 'Sick Leave',    label: 'Sick Leave',      color: '#F59E0B', borderColor: 'border-l-amber-500' },
  { type: 'Personal Day',  label: 'Personal Leave',  color: '#8B5CF6', borderColor: 'border-l-violet-500' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a leave request is in the future (start date is after today) */
function isFutureLeave(req: LeaveRequest): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(req.startDate);
  start.setHours(0, 0, 0, 0);
  return start > today;
}

/** Can edit: future + (Pending or Approved) */
function canEdit(req: LeaveRequest): boolean {
  return isFutureLeave(req) && (req.status === 'Pending' || req.status === 'Approved');
}

/** Can cancel: (Pending) or (Approved + future) */
function canCancel(req: LeaveRequest): boolean {
  if (req.status === 'Pending') return true;
  if (req.status === 'Approved' && isFutureLeave(req)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export const TimeOff: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: allRequests = [], isPending } = useLeaveRequests();
  const { data: balances = [] } = useLeaveBalance(user?.employeeId);
  const { data: empDetail } = useEmployeeDetail(user?.employeeId);
  const cancelMutation = useCancelLeaveRequest();

  const [cancelModalRequest, setCancelModalRequest] = useState<LeaveRequest | null>(null);

  const myRequests = useMemo(
    () => allRequests.filter((r) => r.employeeId === user?.employeeId),
    [allRequests, user?.employeeId],
  );
  const teamRequests = useMemo(
    () => allRequests.filter((r) => r.employeeId !== user?.employeeId),
    [allRequests, user?.employeeId],
  );

  // Last 10 requests sorted by startDate desc
  const recentHistory = useMemo(
    () =>
      [...myRequests]
        .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
        .slice(0, 10),
    [myRequests],
  );

  // Pending days per leave type
  const pendingByType = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of myRequests) {
      if (r.status === 'Pending') {
        map[r.type] = (map[r.type] || 0) + (r.days || 1);
      }
    }
    return map;
  }, [myRequests]);

  const handleCancelConfirm = async () => {
    if (!cancelModalRequest) return;
    try {
      await cancelMutation.mutateAsync(cancelModalRequest.id);
      showToast(
        cancelModalRequest.status === 'Approved'
          ? 'Cancellation request submitted. Awaiting manager confirmation.'
          : 'Leave request cancelled',
        'success',
      );
    } catch (error: any) {
      showToast(error?.message || 'Failed to cancel leave request', 'error');
    } finally {
      setCancelModalRequest(null);
    }
  };

  const getBalance = (type: string): LeaveBalance | undefined => balances.find((b) => b.type === type);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== Profile Header Card ========== */}
      <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
                alt={user?.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-border-light dark:border-border-dark"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-green border-2 border-card-light dark:border-card-dark" />
            </div>
            {/* Info */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-light dark:text-text-dark">
                {user?.name || 'Employee'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
                {empDetail?.department && (
                  <span className="flex items-center gap-1">
                    <Building2 size={14} /> {empDetail.department}
                  </span>
                )}
                {user?.jobTitle && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} /> {user.jobTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/time-off/request')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors w-full sm:w-auto"
          >
            <Plus size={18} /> Request Leave
          </button>
        </div>
      </div>

      {/* ========== Balance Cards ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LEAVE_CARDS.map((card) => {
          const bal = getBalance(card.type);
          const isUnlimited = !bal || bal.total === -1;
          const remaining = bal ? bal.remaining : 0;
          const total = bal ? bal.total : 0;
          const used = bal ? bal.used : 0;
          const pending = pendingByType[card.type] || 0;

          return (
            <div
              key={card.type}
              className={`bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm border-l-4 ${card.borderColor} p-5`}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-light dark:text-text-dark">{card.label}</h3>
                {!isUnlimited && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Allowance: {total} days
                  </span>
                )}
              </div>

              {/* Ring or Contact Manager */}
              {isUnlimited ? (
                <div className="flex flex-col items-center justify-center h-28 text-center">
                  <IdCard size={28} className="text-text-muted-light dark:text-text-muted-dark mb-2" />
                  <p className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">Contact Manager</p>
                </div>
              ) : (
                <ProgressRing remaining={remaining} total={total} color={card.color} />
              )}

              {/* Bottom stats */}
              <div className="flex justify-around mt-4 pt-3 border-t border-border-light dark:border-border-dark text-center">
                <div>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Used</p>
                  <p className="text-lg font-bold text-text-light dark:text-text-dark">{used}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Pending</p>
                  <p className="text-lg font-bold text-text-light dark:text-text-dark">{pending}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========== Calendar + History ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaveCalendar userLeaves={myRequests} teamLeaves={teamRequests} />

        {/* My Leave History */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="p-4 md:p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">My Leave History</h2>
          </div>

          <div className="p-4 md:p-6 space-y-3">
            {recentHistory.length > 0 ? (
              recentHistory.map((req) => {
                const days = req.days ?? 1;
                return (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          req.type === 'Vacation' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600' :
                          req.type === 'Sick Leave' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                          'bg-violet-100 dark:bg-violet-900/20 text-violet-600'
                        }`}>
                          {req.type === 'Vacation' ? <Calendar size={16} /> :
                           req.type === 'Sick Leave' ? <AlertCircle size={16} /> :
                           <Clock size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">{req.type}</p>
                          <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                            {req.dates} &middot; {days} day{days !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Edit button */}
                        {canEdit(req) && (
                          <button
                            onClick={() => navigate(`/time-off/request/${req.id}`)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                        )}

                        {/* Cancel button */}
                        {canCancel(req) && (
                          <button
                            onClick={() => setCancelModalRequest(req)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                          req.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' :
                          req.status === 'Rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' :
                          req.status === 'Cancel Requested' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700' :
                          'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                        }`}>
                          {req.status === 'Approved' && <CheckCircle2 size={12} />}
                          {req.status === 'Rejected' && <XCircle size={12} />}
                          {req.status === 'Pending' && <Clock size={12} />}
                          {req.status === 'Cancel Requested' && <AlertCircle size={12} />}
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {req.status === 'Rejected' && req.rejectionReason && (
                      <p className="mt-2 ml-11 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded px-2 py-1 border border-red-100 dark:border-red-800">
                        Reason: {req.rejectionReason}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark text-sm">
                No leave requests yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Leave Modal */}
      <CancelLeaveModal
        isOpen={!!cancelModalRequest}
        onClose={() => setCancelModalRequest(null)}
        onConfirm={handleCancelConfirm}
        request={cancelModalRequest}
        isPending={cancelMutation.isPending}
      />
    </div>
  );
};
