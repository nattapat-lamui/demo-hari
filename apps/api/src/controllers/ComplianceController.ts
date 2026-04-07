import { Request, Response } from 'express';
import ComplianceService from '../services/ComplianceService';
import { safeErrorMessage } from '../utils/errorResponse';
import { storageService } from '../services/StorageService';

class ComplianceController {
  // GET /api/compliance/items
  async getItems(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        priority: req.query.priority as string | undefined,
        riskLevel: req.query.riskLevel as string | undefined,
        assignedTo: req.query.assignedTo as string | undefined,
        page: Math.max(1, parseInt(req.query.page as string, 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20)),
      };

      // Auto-mark overdue items on each fetch
      await ComplianceService.markOverdueItems();

      const result = await ComplianceService.getAll(filters);
      res.json({
        data: result.items,
        total: result.total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
      });
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to fetch compliance items') });
    }
  }

  // GET /api/compliance/items/:id
  async getItemById(req: Request, res: Response): Promise<void> {
    try {
      const item = await ComplianceService.getById(req.params.id);
      if (!item) { res.status(404).json({ error: 'Compliance item not found' }); return; }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to fetch compliance item') });
    }
  }

  // POST /api/compliance/items
  async createItem(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, priority, riskLevel, assignedTo, assignedDepartment, dueDate } = req.body;
      if (!title) { res.status(400).json({ error: 'Title is required' }); return; }

      const user = req.user as any;
      const item = await ComplianceService.create({
        title, description, category, priority, riskLevel, assignedTo, assignedDepartment, dueDate,
        createdBy: user?.id,
      });
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to create compliance item') });
    }
  }

  // PUT /api/compliance/items/:id
  async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, category, priority, riskLevel, assignedTo, assignedDepartment, dueDate } = req.body;
      const item = await ComplianceService.update(req.params.id, {
        title, description, category, priority, riskLevel, assignedTo, assignedDepartment, dueDate,
      });
      if (!item) { res.status(404).json({ error: 'Compliance item not found' }); return; }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to update compliance item') });
    }
  }

  // DELETE /api/compliance/items/:id
  async deleteItem(req: Request, res: Response): Promise<void> {
    try {
      await ComplianceService.delete(req.params.id);
      res.json({ message: 'Compliance item deleted' });
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to delete compliance item') });
    }
  }

  // PATCH /api/compliance/items/:id/status
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status, reason } = req.body;
      if (!status) { res.status(400).json({ error: 'Status is required' }); return; }

      const user = req.user as any;
      const item = await ComplianceService.updateStatus(req.params.id, status, user?.id, reason);
      if (!item) { res.status(404).json({ error: 'Compliance item not found' }); return; }
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: safeErrorMessage(err, 'Failed to update status') });
    }
  }

  // POST /api/compliance/items/:id/evidence
  async addEvidence(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) { res.status(400).json({ error: 'File is required' }); return; }

      const user = req.user as any;
      const storageKey = `compliance/${req.params.id}/${Date.now()}_${file.originalname}`;

      // Upload to storage
      await storageService.upload({ key: storageKey, body: file.buffer, contentType: file.mimetype });

      const evidence = await ComplianceService.addEvidence(
        req.params.id, storageKey, file.originalname, file.size, user?.id
      );
      res.status(201).json(evidence);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to upload evidence') });
    }
  }

  // GET /api/compliance/items/:id/evidence
  async getEvidence(req: Request, res: Response): Promise<void> {
    try {
      const evidence = await ComplianceService.getEvidence(req.params.id);
      res.json(evidence);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to fetch evidence') });
    }
  }

  // DELETE /api/compliance/evidence/:evidenceId
  async deleteEvidence(req: Request, res: Response): Promise<void> {
    try {
      const filePath = await ComplianceService.deleteEvidence(req.params.evidenceId);
      // Try to delete file from storage (non-blocking)
      try { await storageService.delete(filePath); } catch { /* ignore */ }
      res.json({ message: 'Evidence deleted' });
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to delete evidence') });
    }
  }

  // GET /api/compliance/items/:id/history
  async getStatusHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await ComplianceService.getStatusHistory(req.params.id);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to fetch status history') });
    }
  }

  // POST /api/compliance/check-overdue
  async checkOverdue(_req: Request, res: Response): Promise<void> {
    try {
      const count = await ComplianceService.markOverdueItems();
      res.json({ message: `${count} items marked as overdue` });
    } catch (err) {
      res.status(500).json({ error: safeErrorMessage(err, 'Failed to check overdue items') });
    }
  }
}

export default new ComplianceController();
