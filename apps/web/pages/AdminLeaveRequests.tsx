import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  useLeaveRequests,
  useUpdateLeaveStatus,
  useHandleCancelDecision,
  useAllEmployees,
} from '../hooks/queries';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/Avatar';
import { Pagination } from '../components/Pagination';
import { Dropdown } from '../components/Dropdown';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LeaveDetailModal } from '../components/LeaveDetailModal';
import { LeaveActionBar } from '../components/LeaveActionBar';
import type { LeaveRequest } from '../types';
import { DEPARTMENTS } from '../types';

const ITEMS_PER_PAGE = 10;

const LEAVE_TYPE_COLORS: Record<string, string> = {
  'Vacation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  'Sick Leave': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  'Personal Day': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200',
};

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'All Pending' },
  { value: 'All', label: 'All Requests' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancel Requested', label: 'Cancel Requested' },
];

const LEAVE_TYPE_OPTIONS = [
  { value: 'All', label: 'Leave Type: All' },
  { value: 'Vacation', label: 'Leave Type: Vacation' },
  { value: 'Sick Leave', label: 'Leave Type: Sick Leave' },
  { value: 'Personal Day', label: 'Leave Type: Personal Day' },
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date Requested' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name (A-Z)' },
];

// ---------------------------------------------------------------------------
// Status Filter Button (primary-styled dropdown)
// ---------------------------------------------------------------------------
const StatusFilterButton: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        {selected?.label || value}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-light dark:text-text-dark hover:bg-background-light dark:hover:bg-background-dark'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminLeaveRequests: React.FC = () => {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState('Pending');
  const [typeFilter, setTypeFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date_desc');
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);

  const { data: leaveRequests = [], isPending: isLoadingRequests } = useLeaveRequests();
  const { data: employees = [], isPending: isLoadingEmployees } = useAllEmployees();
  const updateLeaveStatusMutation = useUpdateLeaveStatus();
  const handleCancelDecisionMutation = useHandleCancelDecision();

  // Build employee lookup
  const employeeMap = useMemo(() => {
    const map = new Map<string, { name: string; department: string; avatar: string | null }>();
    for (const e of employees) {
      map.set(e.id, { name: e.name, department: e.department, avatar: e.avatar });
    }
    return map;
  }, [employees]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const pending = leaveRequests.filter((r) => r.status === 'Pending').length;
    const cancelRequested = leaveRequests.filter((r) => r.status === 'Cancel Requested').length;

    const approvedThisMonth = leaveRequests.filter((r) => {
      if (r.status !== 'Approved') return false;
      const d = new Date(r.updatedAt || r.startDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const rejectedThisMonth = leaveRequests.filter((r) => {
      if (r.status !== 'Rejected') return false;
      const d = new Date(r.updatedAt || r.startDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return { pending: pending + cancelRequested, approvedThisMonth, rejectedThisMonth };
  }, [leaveRequests]);

  // Filter & sort requests
  const filteredRequests = useMemo(() => {
    const filtered = leaveRequests.filter((request) => {
      if (statusFilter !== 'All' && request.status !== statusFilter) return false;
      if (typeFilter !== 'All' && request.type !== typeFilter) return false;
      if (departmentFilter !== 'All') {
        const emp = employeeMap.get(request.employeeId);
        if (emp?.department !== departmentFilter) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return (a.startDate ?? '').localeCompare(b.startDate ?? '');
        case 'name_asc':
          return (a.employeeName ?? '').localeCompare(b.employeeName ?? '');
        default: // date_desc
          return (b.startDate ?? '').localeCompare(a.startDate ?? '');
      }
    });
  }, [leaveRequests, employeeMap, statusFilter, typeFilter, departmentFilter, sortBy]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  // Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, departmentFilter, sortBy]);

  const handleApprove = async (id: string) => {
    try {
      await updateLeaveStatusMutation.mutateAsync({ id, status: 'Approved' });
      showToast('Leave request approved', 'success');
    } catch {
      showToast('Failed to approve leave request', 'error');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await updateLeaveStatusMutation.mutateAsync({
        id,
        status: 'Rejected',
        rejectionReason: reason,
      });
      showToast('Leave request rejected', 'success');
    } catch {
      showToast('Failed to reject leave request', 'error');
    }
  };

  const handleCancelDecision = async (
    request: LeaveRequest,
    decision: 'approve_cancel' | 'reject_cancel',
  ) => {
    try {
      await handleCancelDecisionMutation.mutateAsync({ id: request.id, decision });
      showToast(
        decision === 'approve_cancel'
          ? 'Leave cancellation approved'
          : 'Leave cancellation rejected',
        'success',
      );
    } catch {
      showToast('Failed to process cancellation', 'error');
    }
  };

  const departmentOptions = useMemo(() => [
    { value: 'All', label: 'Department: All' },
    ...DEPARTMENTS.map((d) => ({ value: d, label: `Department: ${d}` })),
  ], []);

  if (isLoadingRequests || isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">Leave Requests</h1>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">
          Manage and track employee leave applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Pending Requests</p>
              <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-1">{stats.pending}</p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">Requires attention</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Approved This Month</p>
              <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-1">{stats.approvedThisMonth}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl p-5 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Rejected This Month</p>
              <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-1">{stats.rejectedThisMonth}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <StatusFilterButton
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
          <Dropdown
            options={LEAVE_TYPE_OPTIONS}
            value={typeFilter}
            onChange={setTypeFilter}
            width="w-auto"
          />
          <Dropdown
            options={departmentOptions}
            value={departmentFilter}
            onChange={setDepartmentFilter}
            width="w-auto"
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark whitespace-nowrap">Sort by:</span>
            <Dropdown
              options={SORT_OPTIONS}
              value={sortBy}
              onChange={setSortBy}
              width="w-auto"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-text-muted-light dark:text-text-muted-dark"
                  >
                    No leave requests found
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => {
                  const emp = employeeMap.get(request.employeeId);
                  const days = request.days ?? 1;

                  return (
                    <tr
                      key={request.id}
                      onClick={() => setDetailRequest(request)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={emp?.avatar || null}
                            name={emp?.name || request.employeeName}
                            size="lg"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-text-light dark:text-text-dark">
                              {emp?.name || request.employeeName}
                            </p>
                            <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                              {emp?.department || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            LEAVE_TYPE_COLORS[request.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {request.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-text-light dark:text-text-dark">
                          {request.dates}
                        </p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                          {days} {days === 1 ? 'day' : 'days'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-text-light dark:text-text-dark truncate max-w-xs">
                          {request.reason || 'No reason provided'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {request.status === 'Cancel Requested' ? (
                            <>
                              <button
                                onClick={() => handleCancelDecision(request, 'approve_cancel')}
                                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                              >
                                Approve Cancel
                              </button>
                              <button
                                onClick={() => handleCancelDecision(request, 'reject_cancel')}
                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                              >
                                Reject Cancel
                              </button>
                            </>
                          ) : request.status === 'Pending' ? (
                            <LeaveActionBar
                              employeeName={emp?.name || request.employeeName}
                              onApprove={() => handleApprove(request.id)}
                              onReject={(reason) => handleReject(request.id, reason)}
                              compact={true}
                            />
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                                request.status === 'Approved'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                              }`}
                            >
                              {request.status === 'Approved' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {request.status}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border-light dark:border-border-dark p-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailRequest && (
        <LeaveDetailModal
          isOpen={true}
          request={detailRequest}
          onClose={() => setDetailRequest(null)}
          onApprove={async (id) => {
            await handleApprove(id);
            setDetailRequest(null);
          }}
          onReject={async (req, reason) => {
            await handleReject(req.id, reason);
            setDetailRequest(null);
          }}
        />
      )}
    </div>
  );
};
