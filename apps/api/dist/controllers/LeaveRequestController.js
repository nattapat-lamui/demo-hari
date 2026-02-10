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
exports.LeaveRequestController = void 0;
const LeaveRequestService_1 = __importDefault(require("../services/LeaveRequestService"));
const socket_1 = require("../socket");
const pagination_1 = require("../utils/pagination");
class LeaveRequestController {
    /**
     * Get all leave requests with optional pagination
     * Query params: page, limit, status, employeeId, type, sortBy, sortOrder
     */
    getAllLeaveRequests(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if pagination is requested
                const usePagination = req.query.page !== undefined || req.query.limit !== undefined;
                if (usePagination) {
                    const paginationParams = (0, pagination_1.getPaginationParams)(req);
                    const sortParams = (0, pagination_1.getSortParams)(req, ['created_at', 'start_date', 'end_date', 'status', 'type'], 'created_at', 'DESC');
                    const filters = {
                        status: req.query.status,
                        employeeId: req.query.employeeId,
                        type: req.query.type,
                    };
                    const result = yield LeaveRequestService_1.default.getLeaveRequestsPaginated(paginationParams, filters, sortParams.field, sortParams.order);
                    res.json(result);
                }
                else {
                    // Backward compatibility: return all requests without pagination
                    const requests = yield LeaveRequestService_1.default.getAllLeaveRequests();
                    res.json(requests);
                }
            }
            catch (error) {
                console.error('Get leave requests error:', error);
                res.status(500).json({ error: 'Failed to fetch leave requests' });
            }
        });
    }
    createLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requestData = req.body;
                // Validate required fields
                if (!requestData.employeeId || !requestData.type || !requestData.startDate || !requestData.endDate) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                // Validate dates
                const start = new Date(requestData.startDate);
                const end = new Date(requestData.endDate);
                if (end < start) {
                    res.status(400).json({ error: 'End date must be after start date' });
                    return;
                }
                const leaveRequest = yield LeaveRequestService_1.default.createLeaveRequest(requestData);
                // Emit real-time event
                (0, socket_1.emitLeaveRequestCreated)(leaveRequest);
                res.status(201).json(leaveRequest);
            }
            catch (error) {
                console.error('Create leave request error:', error);
                res.status(400).json({ error: error.message || 'Failed to create leave request' });
            }
        });
    }
    updateLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status } = req.body;
                if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
                    res.status(400).json({ error: 'Invalid status' });
                    return;
                }
                const leaveRequest = yield LeaveRequestService_1.default.updateLeaveRequestStatus(id, { status });
                // Emit real-time event
                (0, socket_1.emitLeaveRequestUpdated)(leaveRequest);
                res.json(leaveRequest);
            }
            catch (error) {
                console.error('Update leave request error:', error);
                if (error.message === 'Leave request not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(400).json({ error: error.message || 'Failed to update leave request' });
                }
            }
        });
    }
    deleteLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield LeaveRequestService_1.default.deleteLeaveRequest(id);
                // Emit real-time event
                (0, socket_1.emitLeaveRequestDeleted)(id);
                res.json({ message: 'Leave request deleted successfully' });
            }
            catch (error) {
                console.error('Delete leave request error:', error);
                if (error.message === 'Leave request not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to delete leave request' });
                }
            }
        });
    }
    getLeaveBalances(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { employeeId } = req.params;
                const balances = yield LeaveRequestService_1.default.getLeaveBalances(employeeId);
                res.json(balances);
            }
            catch (error) {
                console.error('Get leave balances error:', error);
                res.status(500).json({ error: 'Failed to fetch leave balances' });
            }
        });
    }
}
exports.LeaveRequestController = LeaveRequestController;
exports.default = new LeaveRequestController();
