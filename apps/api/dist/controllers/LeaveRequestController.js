"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRequestController = void 0;
const LeaveRequestService_1 = __importStar(require("../services/LeaveRequestService"));
const socket_1 = require("../socket");
const pagination_1 = require("../utils/pagination");
class LeaveRequestController {
    getAllLeaveRequests(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const usePagination = req.query.page !== undefined || req.query.limit !== undefined;
                const sanitize = (requests) => {
                    if ((user === null || user === void 0 ? void 0 : user.role) === 'HR_ADMIN')
                        return requests;
                    return requests.map((r) => r.employeeId === (user === null || user === void 0 ? void 0 : user.employeeId)
                        ? r
                        : LeaveRequestService_1.LeaveRequestService.stripSensitiveLeaveFields(r));
                };
                if (usePagination) {
                    const paginationParams = (0, pagination_1.getPaginationParams)(req);
                    const sortParams = (0, pagination_1.getSortParams)(req, ['created_at', 'start_date', 'end_date', 'status', 'type'], 'created_at', 'DESC');
                    const filters = {
                        status: req.query.status,
                        employeeId: req.query.employeeId,
                        type: req.query.type,
                    };
                    const result = yield LeaveRequestService_1.default.getLeaveRequestsPaginated(paginationParams, filters, sortParams.field, sortParams.order);
                    result.data = sanitize(result.data);
                    res.json(result);
                }
                else {
                    const requests = yield LeaveRequestService_1.default.getAllLeaveRequests();
                    res.json(sanitize(requests));
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
                if (!requestData.employeeId || !requestData.type || !requestData.startDate || !requestData.endDate) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                const start = new Date(requestData.startDate);
                const end = new Date(requestData.endDate);
                if (end < start) {
                    res.status(400).json({ error: 'End date must be after start date' });
                    return;
                }
                if (req.file) {
                    requestData.medicalCertificatePath = `/uploads/medical-certs/${req.file.filename}`;
                }
                const leaveRequest = yield LeaveRequestService_1.default.createLeaveRequest(requestData);
                (0, socket_1.emitLeaveRequestCreated)(leaveRequest);
                res.status(201).json(leaveRequest);
            }
            catch (error) {
                console.error('Create leave request error:', error);
                res.status(400).json({ error: error.message || 'Failed to create leave request' });
            }
        });
    }
    editLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const employeeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId;
                if (!employeeId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const editData = req.body;
                if (!editData.type || !editData.startDate || !editData.endDate) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                const start = new Date(editData.startDate);
                const end = new Date(editData.endDate);
                if (end < start) {
                    res.status(400).json({ error: 'End date must be after start date' });
                    return;
                }
                if (req.file) {
                    editData.medicalCertificatePath = `/uploads/medical-certs/${req.file.filename}`;
                }
                const leaveRequest = yield LeaveRequestService_1.default.editLeaveRequest(id, employeeId, editData);
                (0, socket_1.emitLeaveRequestUpdated)(leaveRequest);
                res.json(leaveRequest);
            }
            catch (error) {
                console.error('Edit leave request error:', error);
                const statusCode = error.statusCode || 400;
                res.status(statusCode).json({ error: error.message || 'Failed to edit leave request' });
            }
        });
    }
    updateLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const { status, rejectionReason } = req.body;
                if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
                    res.status(400).json({ error: 'Invalid status' });
                    return;
                }
                const approverEmployeeId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId) || undefined;
                const leaveRequest = yield LeaveRequestService_1.default.updateLeaveRequestStatus(id, {
                    status,
                    rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
                    approverEmployeeId,
                });
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
    cancelLeaveRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const employeeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId;
                if (!employeeId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                const result = yield LeaveRequestService_1.default.cancelLeaveRequest(id, employeeId);
                if (result.action === 'deleted') {
                    (0, socket_1.emitLeaveRequestDeleted)(id);
                    res.json({ message: 'Leave request cancelled successfully', action: 'deleted' });
                }
                else {
                    // cancel_requested
                    if (result.leaveRequest) {
                        (0, socket_1.emitLeaveRequestUpdated)(result.leaveRequest);
                    }
                    res.json({ message: 'Leave cancellation requested. Awaiting manager confirmation.', action: 'cancel_requested' });
                }
            }
            catch (error) {
                console.error('Cancel leave request error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ error: error.message || 'Failed to cancel leave request' });
            }
        });
    }
    handleCancelDecision(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = req.params;
                const { decision } = req.body;
                const approverEmployeeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId;
                if (!approverEmployeeId) {
                    res.status(401).json({ error: 'Unauthorized' });
                    return;
                }
                if (!decision || !['approve_cancel', 'reject_cancel'].includes(decision)) {
                    res.status(400).json({ error: 'Invalid decision. Must be "approve_cancel" or "reject_cancel".' });
                    return;
                }
                const result = yield LeaveRequestService_1.default.handleCancelDecision(id, decision, approverEmployeeId);
                if (result.action === 'deleted') {
                    (0, socket_1.emitLeaveRequestDeleted)(id);
                    res.json({ message: 'Leave cancellation approved. Request has been deleted.' });
                }
                else {
                    // reverted
                    if (result.leaveRequest) {
                        (0, socket_1.emitLeaveRequestUpdated)(result.leaveRequest);
                    }
                    res.json({ message: 'Leave cancellation rejected. Request reverted to Approved.' });
                }
            }
            catch (error) {
                console.error('Handle cancel decision error:', error);
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ error: error.message || 'Failed to handle cancel decision' });
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
