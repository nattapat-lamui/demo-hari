import { Router } from 'express';
import DocumentController from '../controllers/DocumentController';
import { apiLimiter } from '../middlewares/security';
import { authenticateToken } from '../middlewares/auth';
import { cacheMiddleware, invalidateCache } from '../middlewares/cache';
import { documentUpload } from '../middlewares/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/documents - Get all documents - cached for 30s
router.get('/', cacheMiddleware(), DocumentController.getAllDocuments.bind(DocumentController));

// POST /api/documents - Upload document
router.post(
    '/',
    apiLimiter,
    documentUpload.single('file'),
    invalidateCache('/api/documents'),
    DocumentController.createDocument.bind(DocumentController)
);

// GET /api/documents/trash - Get deleted documents (must be before :id route) - cached for 30s
router.get('/trash', cacheMiddleware(), DocumentController.getDeletedDocuments.bind(DocumentController));

// GET /api/documents/storage - Get storage statistics - cached for 60s
router.get('/storage', cacheMiddleware(60000), DocumentController.getStorageStats.bind(DocumentController));

// GET /api/documents/:id/download - Download document
router.get('/:id/download', DocumentController.downloadDocument.bind(DocumentController));

// POST /api/documents/:id/restore - Restore from trash
router.post('/:id/restore', apiLimiter, invalidateCache('/api/documents'), DocumentController.restoreDocument.bind(DocumentController));

// DELETE /api/documents/:id - Soft delete (move to trash)
router.delete('/:id', apiLimiter, invalidateCache('/api/documents'), DocumentController.deleteDocument.bind(DocumentController));

// DELETE /api/documents/:id/permanent - Permanent delete
router.delete('/:id/permanent', apiLimiter, invalidateCache('/api/documents'), DocumentController.permanentDeleteDocument.bind(DocumentController));

export default router;
