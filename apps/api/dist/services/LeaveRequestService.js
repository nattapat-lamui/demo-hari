"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestService = void 0;
const db_1 = require("../db");
const SystemConfigService_1 = __importDefault(require("./SystemConfigService"));
const NotificationService_1 = __importDefault(require("./NotificationService"));
const pagination_1 = require("../utils/pagination");
const BASE_SELECT = `
    SELECT lr.*, e.avatar, e.name as employee_name,
           (lr.end_date::date - lr.start_date::date) + 1 as days,
           TO_CHAR(lr.start_date, 'Mon DD') || ' - ' || TO_CHAR(lr.end_date, 'Mon DD') as dates,
           he.name as handover_employee_name
    FROM leave_requests lr
    LEFT JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN employees he ON lr.handover_employee_id = he.id`;
class LeaveRequestService {
    getAllLeaveRequests() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`
            ${BASE_SELECT}
            ORDER BY lr.created_at DESC
        `);
            return result.rows.map(this.mapRowToLeaveRequest);
        });
    }
    getLeaveRequestsPaginated(paginationParams_1, filters_1) {
        return __awaiter(this, arguments, void 0, function* (paginationParams, filters, sortField = 'created_at', sortOrder = 'DESC') {
            // Build WHERE clause for filters
            const whereClauses = [];
            const params = [];
            let paramCount = 0;
            if (filters.status) {
                paramCount++;
                whereClauses.push(`lr.status = $${paramCount}`);
                params.push(filters.status);
            }
            if (filters.employeeId) {
                paramCount++;
                whereClauses.push(`lr.employee_id = $${paramCount}`);
                params.push(filters.employeeId);
            }
            if (filters.type) {
                paramCount++;
                whereClauses.push(`lr.leave_type = $${paramCount}`);
                params.push(filters.type);
            }
            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
            // Field mapping for sorting
            const fieldMapping = {
                'created_at': 'lr.created_at',
                'start_date': 'lr.start_date',
                'end_date': 'lr.end_date',
                'status': 'lr.status',
                'type': 'lr.leave_type',
            };
            // Get total count
            const countResult = yield (0, db_1.query)(`SELECT COUNT(*) as total
             FROM leave_requests lr
             ${whereClause}`, params);
            const total = parseInt(countResult.rows[0].total);
            // Get paginated data
            const sortClause = (0, pagination_1.buildSortClause)(sortField, sortOrder, fieldMapping);
            const paginationClause = (0, pagination_1.buildPaginationClause)(paginationParams);
            const result = yield (0, db_1.query)(`SELECT lr.*, e.avatar, e.name as employee_name,
                    (lr.end_date::date - lr.start_date::date) + 1 as days,
                    TO_CHAR(lr.start_date, 'Mon DD') || ' - ' || TO_CHAR(lr.end_date, 'Mon DD') as dates,
                    he.name as handover_employee_name
             FROM leave_requests lr
             LEFT JOIN employees e ON lr.employee_id = e.id
             LEFT JOIN employees he ON lr.handover_employee_id = he.id
             ${whereClause}
             ${sortClause}
             ${paginationClause}`, params);
            const data = result.rows.map(this.mapRowToLeaveRequest);
            return (0, pagination_1.createPaginatedResult)(data, total, paginationParams);
        });
    }
    getLeaveRequestById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`${BASE_SELECT}
             WHERE lr.id = $1`, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToLeaveRequest(result.rows[0]);
        });
    }
    createLeaveRequest(requestData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { employeeId, type, startDate, endDate, reason, handoverEmployeeId, handoverNotes, medicalCertificatePath } = requestData;
            // Calculate days
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            // Validate leave quota for limited types (Vacation, Sick Leave)
            const leaveQuotas = yield SystemConfigService_1.default.getLeaveQuotas();
            const quota = leaveQuotas.find(q => q.type === type);
            if (quota && quota.total !== -1) {
                const usedResult = yield (0, db_1.query)(`SELECT COALESCE(SUM((end_date::date - start_date::date) + 1), 0) as used_days
                 FROM leave_requests
                 WHERE employee_id = $1 AND leave_type = $2 AND status IN ('Approved', 'Pending')`, [employeeId, type]);
                const usedDays = parseInt(((_a = usedResult.rows[0]) === null || _a === void 0 ? void 0 : _a.used_days) || '0', 10);
                const remaining = quota.total - usedDays;
                if (days > remaining) {
                    const err = new Error(remaining <= 0
                        ? `You have no remaining ${type} days. (${usedDays}/${quota.total} used)`
                        : `Insufficient ${type} balance. You have ${remaining} day(s) remaining but requested ${days}.`);
                    err.statusCode = 400;
                    throw err;
                }
            }
            // Validate: Sick Leave >= 3 days requires medical certificate
            if (type === 'Sick Leave' && days >= 3 && !medicalCertificatePath) {
                const err = new Error('A medical certificate is required for sick leave of 3 or more days.');
                err.statusCode = 400;
                throw err;
            }
            // Format dates string (for notification only)
            const options = { month: 'short', day: 'numeric' };
            const dates = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
            const result = yield (0, db_1.query)(`INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, handover_employee_id, handover_notes, medical_certificate_path)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`, [employeeId, type, startDate, endDate, reason || '', 'Pending', handoverEmployeeId || null, handoverNotes || null, medicalCertificatePath || null]);
            // Get employee info (avatar and name)
            const employeeResult = yield (0, db_1.query)('SELECT avatar, name FROM employees WHERE id = $1', [employeeId]);
            const avatar = (_b = employeeResult.rows[0]) === null || _b === void 0 ? void 0 : _b.avatar;
            const employeeName = (_c = employeeResult.rows[0]) === null || _c === void 0 ? void 0 : _c.name;
            // Notify HR admins about new leave request
            try {
                yield NotificationService_1.default.notifyAdmins({
                    title: 'New Leave Request',
                    message: `${employeeName} has submitted a ${type} leave request (${dates}).`,
                    type: 'leave',
                    link: '/time-off',
                });
            }
            catch (notifError) {
                console.error('Failed to notify admins about leave request:', notifError);
            }
            return Object.assign(Object.assign({}, this.mapRowToLeaveRequest(result.rows[0])), { avatar,
                employeeName,
                // Add computed fields
                dates,
                days });
        });
    }
    updateLeaveRequestStatus(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { status } = updateData;
            const result = yield (0, db_1.query)(`UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
            if (result.rows.length === 0) {
                throw new Error('Leave request not found');
            }
            const leaveRequest = this.mapRowToLeaveRequest(result.rows[0]);
            // Send notification to employee about status change
            try {
                // Get employee's user_id
                const employeeResult = yield (0, db_1.query)('SELECT user_id, name FROM employees WHERE id = $1', [leaveRequest.employeeId]);
                if ((_a = employeeResult.rows[0]) === null || _a === void 0 ? void 0 : _a.user_id) {
                    const employee = employeeResult.rows[0];
                    const isApproved = status === 'Approved';
                    yield NotificationService_1.default.create({
                        user_id: employee.user_id,
                        title: `Leave Request ${status}`,
                        message: isApproved
                            ? `Your ${leaveRequest.type} leave request has been approved.`
                            : `Your ${leaveRequest.type} leave request has been ${status.toLowerCase()}.`,
                        type: isApproved ? 'success' : 'warning',
                        link: '/time-off',
                    });
                }
            }
            catch (notifError) {
                console.error('Failed to send leave status notification:', notifError);
            }
            return leaveRequest;
        });
    }
    deleteLeaveRequest(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)('DELETE FROM leave_requests WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                throw new Error('Leave request not found');
            }
        });
    }
    getLeaveBalances(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get all leave requests for this employee
            // Calculate days from start_date and end_date since 'days' column doesn't exist
            const result = yield (0, db_1.query)(`SELECT leave_type,
                    SUM((end_date::date - start_date::date) + 1) as used_days
             FROM leave_requests
             WHERE employee_id = $1 AND status = 'Approved'
             GROUP BY leave_type`, [employeeId]);
            const usedDays = result.rows.reduce((acc, row) => {
                acc[row.leave_type] = parseInt(row.used_days);
                return acc;
            }, {});
            // Get leave quotas from database configuration
            const leaveQuotas = yield SystemConfigService_1.default.getLeaveQuotas();
            return leaveQuotas.map(({ type, total }) => ({
                type,
                total, // -1 means unlimited (JSON-safe, unlike Infinity)
                used: usedDays[type] || 0,
                remaining: total === -1 ? -1 : Math.max(0, total - (usedDays[type] || 0)),
            }));
        });
    }
    mapRowToLeaveRequest(row) {
        return {
            id: row.id,
            employeeId: row.employee_id,
            employeeName: row.employee_name,
            type: row.leave_type,
            startDate: row.start_date,
            endDate: row.end_date,
            dates: row.dates,
            days: row.days,
            reason: row.reason,
            status: row.status,
            avatar: row.avatar,
            handoverEmployeeId: row.handover_employee_id || undefined,
            handoverEmployeeName: row.handover_employee_name || undefined,
            handoverNotes: row.handover_notes || undefined,
            medicalCertificatePath: row.medical_certificate_path || undefined,
        };
    }
}
exports.LeaveRequestService = LeaveRequestService;
exports.default = new LeaveRequestService();
