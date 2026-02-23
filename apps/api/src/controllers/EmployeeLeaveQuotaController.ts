import { Request, Response } from 'express';
import EmployeeLeaveQuotaService from '../services/EmployeeLeaveQuotaService';

export class EmployeeLeaveQuotaController {
    async getEffectiveQuotas(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const quotas = await EmployeeLeaveQuotaService.getEffectiveQuotas(id);
            res.json(quotas);
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ error: error.message || 'Failed to get leave quotas' });
        }
    }

    async upsertOverrides(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { overrides } = req.body;

            if (!Array.isArray(overrides)) {
                res.status(400).json({ error: 'overrides must be an array' });
                return;
            }

            const quotas = await EmployeeLeaveQuotaService.upsertOverrides(id, overrides);
            res.json(quotas);
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ error: error.message || 'Failed to update leave quotas' });
        }
    }

    async deleteOverride(req: Request, res: Response): Promise<void> {
        try {
            const { id, type } = req.params;
            const quotas = await EmployeeLeaveQuotaService.deleteOverride(id, type);
            res.json(quotas);
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ error: error.message || 'Failed to delete leave quota override' });
        }
    }
}

export default new EmployeeLeaveQuotaController();
