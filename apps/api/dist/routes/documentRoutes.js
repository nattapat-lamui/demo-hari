"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DocumentController_1 = __importDefault(require("../controllers/DocumentController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const cache_1 = require("../middlewares/cache");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/documents - Get all documents - cached for 30s
router.get('/', (0, cache_1.cacheMiddleware)(), DocumentController_1.default.getAllDocuments.bind(DocumentController_1.default));
// POST /api/documents - Upload document
router.post('/', security_1.apiLimiter, upload_1.documentUpload.single('file'), (0, cache_1.invalidateCache)('/api/documents'), DocumentController_1.default.createDocument.bind(DocumentController_1.default));
// GET /api/documents/trash - Get deleted documents (must be before :id route) - cached for 30s
router.get('/trash', (0, cache_1.cacheMiddleware)(), DocumentController_1.default.getDeletedDocuments.bind(DocumentController_1.default));
// GET /api/documents/storage - Get storage statistics - cached for 60s
router.get('/storage', (0, cache_1.cacheMiddleware)(60000), DocumentController_1.default.getStorageStats.bind(DocumentController_1.default));
// GET /api/documents/:id/download - Download document
router.get('/:id/download', DocumentController_1.default.downloadDocument.bind(DocumentController_1.default));
// POST /api/documents/:id/restore - Restore from trash
router.post('/:id/restore', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/documents'), DocumentController_1.default.restoreDocument.bind(DocumentController_1.default));
// DELETE /api/documents/:id - Soft delete (move to trash)
router.delete('/:id', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/documents'), DocumentController_1.default.deleteDocument.bind(DocumentController_1.default));
// DELETE /api/documents/:id/permanent - Permanent delete
router.delete('/:id/permanent', security_1.apiLimiter, (0, cache_1.invalidateCache)('/api/documents'), DocumentController_1.default.permanentDeleteDocument.bind(DocumentController_1.default));
exports.default = router;
