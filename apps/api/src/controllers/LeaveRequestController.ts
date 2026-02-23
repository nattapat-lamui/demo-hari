import { Request, Response } from 'express';
import LeaveRequestService, { LeaveRequestService as LeaveRequestServiceClass } from '../services/LeaveRequestService';
import { emitLeaveRequestCreated, emitLeaveRequestUpdated, emitLeaveRequestDeleted } from '../socket';
import { getPaginationParams, getSortParams } from '../utils/pagination';
import type { LeaveRequest } from '../models/LeaveRequest';

export class LeaveRequestController {
    async getAllLeaveRequests(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const usePagination = req.query.page !== undefined || req.query.limit !== undefined;

            const sanitize = (requests: LeaveRequest[]) => {
                if (user?.role === 'HR_ADMIN') return requests;
                return requests.map((r) =>
                    r.employeeId === user?.employeeId
                        ? r
                        : LeaveRequestServiceClass.stripSensitiveLeaveFields(r)
                );
            };

            if (usePagination) {
                const paginationParams = getPaginationParams(req);
                const sortParams = getSortParams(
                    req,
                    ['created_at', 'start_date', 'end_date', 'status', 'type'],
                    'created_at',
                    'DESC'
                );

                const filters = {
                    status: req.query.status as string | undefined,
                    employeeId: req.query.employeeId as string | undefined,
                    type: req.query.type as string | undefined,
                };

                const result = await LeaveRequestService.getLeaveRequestsPaginated(
                    paginationParams,
                    filters,
                    sortParams.field,
                    sortParams.order
                );

                result.data = sanitize(result.data);
                res.json(result);
            } else {
                const requests = await LeaveRequestService.getAllLeaveRequests();
                res.json(sanitize(requests));
            }
        } catch (error: any) {
            console.error('Get leave requests error:', error);
            res.status(500).json({ error: 'Failed to fetch leave requests' });
        }
    }

    async createLeaveRequest(req: Request, res: Response): Promise<void> {
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

            const leaveRequest = await LeaveRequestService.createLeaveRequest(requestData);

            emitLeaveRequestCreated(leaveRequest);

            res.status(201).json(leaveRequest);
        } catch (error: any) {
            console.error('Create leave request error:', error);
            res.status(400).json({ error: error.message || 'Failed to create leave request' });
        }
    }

    async editLeaveRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const employeeId = (req as any).user?.employeeId;

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

            const leaveRequest = await LeaveRequestService.editLeaveRequest(id, employeeId, editData);

            emitLeaveRequestUpdated(leaveRequest);

            res.json(leaveRequest);
        } catch (error: any) {
            console.error('Edit leave request error:', error);
            const statusCode = error.statusCode || 400;
            res.status(statusCode).json({ error: error.message || 'Failed to edit leave request' });
        }
    }

    async updateLeaveRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;

            if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
                res.status(400).json({ error: 'Invalid status' });
                return;
            }

            const approverEmployeeId = (req as any).user?.employeeId || undefined;
            const leaveRequest = await LeaveRequestService.updateLeaveRequestStatus(id, {
                status,
                rejectionReason: status === 'Rejected' ? rejectionReason : undefined,
                approverEmployeeId,
            });

            emitLeaveRequestUpdated(leaveRequest);

            res.json(leaveRequest);
        } catch (error: any) {
            console.error('Update leave request error:', error);
            if (error.message === 'Leave request not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(400).json({ error: error.message || 'Failed to update leave request' });
            }
        }
    }

    async deleteLeaveRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await LeaveRequestService.deleteLeaveRequest(id);

            emitLeaveRequestDeleted(id);

            res.json({ message: 'Leave request deleted successfully' });
        } catch (error: any) {
            console.error('Delete leave request error:', error);
            if (error.message === 'Leave request not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Failed to delete leave request' });
            }
        }
    }

    async cancelLeaveRequest(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const employeeId = (req as any).user?.employeeId;

            if (!employeeId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const result = await LeaveRequestService.cancelLeaveRequest(id, employeeId);

            if (result.action === 'deleted') {
                emitLeaveRequestDeleted(id);
                res.json({ message: 'Leave request cancelled successfully', action: 'deleted' });
            } else {
                // cancel_requested
                if (result.leaveRequest) {
                    emitLeaveRequestUpdated(result.leaveRequest);
                }
                res.json({ message: 'Leave cancellation requested. Awaiting manager confirmation.', action: 'cancel_requested' });
            }
        } catch (error: any) {
            console.error('Cancel leave request error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ error: error.message || 'Failed to cancel leave request' });
        }
    }

    async handleCancelDecision(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { decision } = req.body;
            const approverEmployeeId = (req as any).user?.employeeId;

            if (!approverEmployeeId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            if (!decision || !['approve_cancel', 'reject_cancel'].includes(decision)) {
                res.status(400).json({ error: 'Invalid decision. Must be "approve_cancel" or "reject_cancel".' });
                return;
            }

            const result = await LeaveRequestService.handleCancelDecision(id, decision, approverEmployeeId);

            if (result.action === 'deleted') {
                emitLeaveRequestDeleted(id);
                res.json({ message: 'Leave cancellation approved. Request has been deleted.' });
            } else {
                // reverted
                if (result.leaveRequest) {
                    emitLeaveRequestUpdated(result.leaveRequest);
                }
                res.json({ message: 'Leave cancellation rejected. Request reverted to Approved.' });
            }
        } catch (error: any) {
            console.error('Handle cancel decision error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ error: error.message || 'Failed to handle cancel decision' });
        }
    }

    async getLeaveBalances(req: Request, res: Response): Promise<void> {
        try {
            const { employeeId } = req.params;
            const balances = await LeaveRequestService.getLeaveBalances(employeeId);
            res.json(balances);
        } catch (error: any) {
            console.error('Get leave balances error:', error);
            res.status(500).json({ error: 'Failed to fetch leave balances' });
        }
    }
}

export default new LeaveRequestController();
