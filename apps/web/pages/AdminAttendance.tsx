import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Activity,
  LogOut,
  UserX,
  Plus,
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  Download,
} from 'lucide-react';
import { Dropdown, DropdownOption } from '../components/Dropdown';
import { DatePicker } from '../components/DatePicker';
import { Pagination } from '../components/Pagination';
import { UpsertAttendanceModal } from '../components/UpsertAttendanceModal';
import { useToast } from '../contexts/ToastContext';
import {
  useAdminAttendanceSnapshot,
  useAdminAttendanceRecords,
  useAdminUpsertAttendance,
  useAdminDeleteAttendance,
  useAllEmployees,
} from '../hooks/queries';
import { formatTimeTH } from '../lib/date';
import type { AdminAttendanceRecord, AdminAttendanceFilters, AdminDisplayStatus, AttendanceStatus } from '../types';

const ITEMS_PER_PAGE = 20;

const DEPARTMENTS: DropdownOption[] = [
  { value: 'All', label: 'All Departments' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Customer Support', label: 'Customer Support' },
  { value: 'Tester', label: 'Tester' },
];

const STATUS_FILTER_OPTIONS: DropdownOption[] = [
  { value: 'All', label: 'All Statuses' },
  { value: 'Present', label: 'Present Today' },
  { value: 'Active', label: 'Active Now' },
  { value: 'Checked Out', label: 'Checked Out' },
  { value: 'Not In', label: 'Not In / On-Leave' },
];

const getStatusStyle = (status: AdminDisplayStatus | string): { dot: string; badge: string } => {
  switch (status) {
    case 'Active':
      return { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800' };
    case 'Checked Out':
      return { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800' };
    case 'On-Leave':
      return { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-800' };
    case 'Not In':
      return { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-800' };
    default:
      return { dot: 'bg-gray-500', badge: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:ring-gray-800' };
  }
};

const formatTime = formatTimeTH;

const AdminAttendance: React.FC = () => {
  const { showToast } = useToast();

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminAttendanceRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [department, status, selectedDate]);

  const filters: AdminAttendanceFilters = {
    search: debouncedSearch || undefined,
    department: department !== 'All' ? department : undefined,
    status: status !== 'All' ? status : undefined,
    startDate: selectedDate,
    endDate: selectedDate,
    page,
    limit: ITEMS_PER_PAGE,
  };

  // Queries
  const { data: snapshot } = useAdminAttendanceSnapshot();
  const { data: recordsResponse, isPending: loading } = useAdminAttendanceRecords(filters);
  const { data: allEmployees = [] } = useAllEmployees();
  const upsertMutation = useAdminUpsertAttendance();
  const deleteMutation = useAdminDeleteAttendance();

  const records = recordsResponse?.data || [];
  const totalPages = recordsResponse?.totalPages || 1;
  const totalItems = recordsResponse?.total || 0;

  const handleOpenAdd = useCallback(() => {
    setEditingRecord(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((record: AdminAttendanceRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleSubmit = useCallback(
    (data: {
      employeeId: string;
      date: string;
      clockIn?: string;
      clockOut?: string;
      status?: AttendanceStatus;
      notes?: string;
    }) => {
      upsertMutation.mutate(data, {
        onSuccess: () => {
          showToast(editingRecord ? 'Attendance record updated' : 'Attendance record added', 'success');
          handleCloseModal();
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to save record', 'error');
        },
      });
    },
    [upsertMutation, editingRecord, showToast, handleCloseModal],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          showToast('Attendance record deleted', 'success');
          setDeleteConfirmId(null);
        },
        onError: (error) => {
          showToast(error instanceof Error ? error.message : 'Failed to delete record', 'error');
        },
      });
    },
    [deleteMutation, showToast],
  );

  const handleCardClick = useCallback((filterValue: string) => {
    setStatus(filterValue);
  }, []);

  const exportToCSV = useCallback(() => {
    if (records.length === 0) {
      showToast('No records to export', 'error');
      return;
    }

    const headers = ['Employee', 'Department', 'Check In', 'Check Out', 'Hours', 'Overtime', 'Auto-checkout', 'Status'];
    const rows = records.map((r) => [
      r.employeeName,
      r.employeeDepartment,
      r.clockIn ? formatTime(r.clockIn) : '-',
      r.clockOut ? formatTime(r.clockOut) : '-',
      r.totalHours != null ? Number(r.totalHours).toFixed(1) : '-',
      r.overtimeHours != null && r.overtimeHours > 0 ? Number(r.overtimeHours).toFixed(1) : '0',
      r.autoCheckout ? 'Yes' : 'No',
      r.displayStatus || r.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [records, selectedDate, showToast]);

  const displayStatus = (record: AdminAttendanceRecord): string =>
    record.displayStatus || record.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-light dark:text-text-dark tracking-tight">
            Admin Attendance Dashboard
          </h1>
          <p className="text-sm sm:text-base text-text-muted-light dark:text-text-muted-dark mt-1">
            Monitor and manage employee attendance records
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          <span>Add Record</span>
        </button>
      </div>

      {/* Snapshot Cards — click to filter */}
      {snapshot && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <SnapshotCard
            icon={<Users size={20} />}
            label="Total Employees"
            value={snapshot.total}
            iconColor="bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
            filterValue="All"
            activeFilter={status}
            onClick={handleCardClick}
          />
          <SnapshotCard
            icon={<UserCheck size={20} />}
            label="Present Today"
            value={snapshot.presentToday}
            iconColor="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
            filterValue="Present"
            activeFilter={status}
            onClick={handleCardClick}
          />
          <SnapshotCard
            icon={<Activity size={20} />}
            label="Active Now"
            value={snapshot.activeNow}
            iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            filterValue="Active"
            activeFilter={status}
            onClick={handleCardClick}
          />
          <SnapshotCard
            icon={<LogOut size={20} />}
            label="Checked Out"
            value={snapshot.checkedOut}
            iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            filterValue="Checked Out"
            activeFilter={status}
            onClick={handleCardClick}
          />
          <SnapshotCard
            icon={<UserX size={20} />}
            label="Not In / On-Leave"
            value={snapshot.absentOrLeave}
            iconColor="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            filterValue="Not In"
            activeFilter={status}
            onClick={handleCardClick}
          />
        </div>
      )}

      {/* Records Table */}
      <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar: Search + Filters | Date + Export */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative sm:w-56">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search employee..."
                className="w-full pl-10 pr-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Dropdown
              options={DEPARTMENTS}
              value={department}
              onChange={setDepartment}
              width="w-full sm:w-40"
            />
            <Dropdown
              options={STATUS_FILTER_OPTIONS}
              value={status}
              onChange={setStatus}
              width="w-full sm:w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <DatePicker value={selectedDate} onChange={setSelectedDate} placeholder="Select date" />
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  OT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted-light dark:text-text-muted-dark">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted-light dark:text-text-muted-dark">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {record.employeeAvatar ? (
                          <img
                            src={record.employeeAvatar}
                            alt={record.employeeName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                            {record.employeeName.charAt(0)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-text-light dark:text-text-dark">
                          {record.employeeName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">
                      {record.employeeDepartment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light dark:text-text-dark">
                      {formatTime(record.clockIn)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light dark:text-text-dark">
                      {formatTime(record.clockOut)}
                      {record.autoCheckout && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">(auto)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light dark:text-text-dark">
                      {record.totalHours != null ? `${Number(record.totalHours).toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.overtimeHours != null && record.overtimeHours > 0
                        ? <span className="text-amber-600 dark:text-amber-400 font-medium">{Number(record.overtimeHours).toFixed(1)}h</span>
                        : <span className="text-text-muted-light dark:text-text-muted-dark">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const ds = displayStatus(record);
                          const s = getStatusStyle(ds);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${s.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                              {ds}
                            </span>
                          );
                        })()}
                        {record.earlyDeparture && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Early</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === record.id ? null : record.id)}
                          className="p-1.5 text-text-muted-light hover:text-text-light dark:text-text-muted-dark dark:hover:text-text-dark rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {actionMenuId === record.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => { handleOpenEdit(record); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                              {deleteConfirmId === record.id ? (
                                <div className="flex items-center gap-1 px-3 py-2">
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => { setDeleteConfirmId(null); setActionMenuId(null); }}
                                    className="px-2 py-1 text-xs font-medium text-text-muted-light dark:text-text-muted-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(record.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4">
          {loading ? (
            <div className="py-8 text-center text-text-muted-light dark:text-text-muted-dark">
              Loading attendance records...
            </div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-text-muted-light dark:text-text-muted-dark">
              No attendance records found
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {record.employeeAvatar ? (
                        <img
                          src={record.employeeAvatar}
                          alt={record.employeeName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {record.employeeName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-text-light dark:text-text-dark">
                          {record.employeeName}
                        </p>
                        <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                          {record.employeeDepartment}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const ds = displayStatus(record);
                        const s = getStatusStyle(ds);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ring-1 ring-inset ${s.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {ds}
                          </span>
                        );
                      })()}
                      {record.autoCheckout && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Auto</span>
                      )}
                      {record.earlyDeparture && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Early</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-text-muted-light dark:text-text-muted-dark">Check In</p>
                      <p className="font-medium text-text-light dark:text-text-dark">{formatTime(record.clockIn)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted-light dark:text-text-muted-dark">Check Out</p>
                      <p className="font-medium text-text-light dark:text-text-dark">{formatTime(record.clockOut)}</p>
                    </div>
                    <div>
                      <p className="text-text-muted-light dark:text-text-muted-dark">Hours</p>
                      <p className="font-medium text-text-light dark:text-text-dark">{record.totalHours != null ? `${Number(record.totalHours).toFixed(1)}h` : '-'}</p>
                    </div>
                    <div>
                      <p className="text-text-muted-light dark:text-text-muted-dark">OT</p>
                      <p className="font-medium text-amber-600 dark:text-amber-400">
                        {record.overtimeHours != null && record.overtimeHours > 0 ? `${Number(record.overtimeHours).toFixed(1)}h` : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                    <button
                      onClick={() => handleOpenEdit(record)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    {deleteConfirmId === record.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-text-muted-light dark:text-text-muted-dark transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(record.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Upsert Modal */}
      <UpsertAttendanceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        employees={allEmployees}
        editingRecord={editingRecord}
        isPending={upsertMutation.isPending}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Snapshot Card sub-component
// ---------------------------------------------------------------------------

interface SnapshotCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconColor: string;
  subtitle?: string;
  filterValue: string;
  activeFilter: string;
  onClick: (filterValue: string) => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({ icon, label, value, iconColor, subtitle, filterValue, activeFilter, onClick }) => {
  const isActive = activeFilter === filterValue;
  return (
    <button
      onClick={() => onClick(filterValue)}
      className={`p-4 rounded-xl transition-all text-left w-full cursor-pointer border ${
        isActive
          ? 'bg-primary/5 dark:bg-primary/10 border-primary/40 shadow-sm'
          : 'bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark truncate">{label}</p>
          <p className="text-xl font-bold text-text-light dark:text-text-dark">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </button>
  );
};

export default AdminAttendance;
