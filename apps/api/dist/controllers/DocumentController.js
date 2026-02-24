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
exports.DocumentController = void 0;
const DocumentService_1 = __importDefault(require("../services/DocumentService"));
const path_1 = __importDefault(require("path"));
const pagination_1 = require("../utils/pagination");
const StorageService_1 = require("../services/StorageService");
const upload_1 = require("../middlewares/upload");
// Fix UTF-8 filename encoding from multipart form
const fixFilename = (filename) => {
    try {
        // Try to decode from latin1 to UTF-8 (common browser encoding issue)
        return Buffer.from(filename, 'latin1').toString('utf8');
    }
    catch (_a) {
        return filename;
    }
};
class DocumentController {
    /**
     * Get all documents with optional pagination
     * Query params: page, limit, category, type, search, sortBy, sortOrder
     */
    getAllDocuments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if pagination is requested
                const usePagination = req.query.page !== undefined || req.query.limit !== undefined;
                if (usePagination) {
                    const paginationParams = (0, pagination_1.getPaginationParams)(req);
                    const sortParams = (0, pagination_1.getSortParams)(req, ['created_at', 'name', 'type', 'size', 'category'], 'created_at', 'DESC');
                    const filters = {
                        category: req.query.category,
                        type: req.query.type,
                        search: req.query.search,
                    };
                    const result = yield DocumentService_1.default.getDocumentsPaginated(paginationParams, filters, sortParams.field, sortParams.order);
                    res.json(result);
                }
                else {
                    // Backward compatibility: return all documents without pagination
                    const documents = yield DocumentService_1.default.getAllDocuments();
                    res.json(documents);
                }
            }
            catch (error) {
                console.error('Get documents error:', error);
                res.status(500).json({ error: 'Failed to fetch documents' });
            }
        });
    }
    createDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = req.file;
                if (!file) {
                    res.status(400).json({ error: 'No file uploaded' });
                    return;
                }
                const { category, ownerName, employeeId } = req.body;
                if (!category || !ownerName || !employeeId) {
                    res.status(400).json({ error: 'Missing required fields' });
                    return;
                }
                const originalName = fixFilename(file.originalname);
                const key = (0, upload_1.generateStorageKey)('documents', file);
                const buffer = (0, upload_1.getFileBuffer)(file);
                yield StorageService_1.storageService.upload({ key, body: buffer, contentType: file.mimetype });
                const documentData = {
                    name: originalName,
                    type: path_1.default.extname(originalName).substring(1).toUpperCase(),
                    size: file.size,
                    category,
                    ownerName,
                    employeeId,
                    filePath: key,
                };
                const document = yield DocumentService_1.default.createDocument(documentData);
                res.status(201).json(document);
            }
            catch (error) {
                console.error('Create document error:', error);
                res.status(400).json({ error: error.message || 'Failed to upload document' });
            }
        });
    }
    downloadDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const user = req.user;
                // Ownership check: fetch document first to verify access
                const document = yield DocumentService_1.default.getDocumentById(id);
                if (!document) {
                    res.status(404).json({ error: 'Document not found' });
                    return;
                }
                if (user.role !== 'HR_ADMIN' && user.employeeId !== document.employeeId) {
                    res.status(403).json({ error: 'Access denied' });
                    return;
                }
                const key = yield DocumentService_1.default.getDocumentFilePath(id);
                const { body, contentType, contentLength } = yield StorageService_1.storageService.download(key);
                res.setHeader('Content-Type', contentType);
                if (contentLength)
                    res.setHeader('Content-Length', contentLength);
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`);
                body.pipe(res);
            }
            catch (error) {
                console.error('Download document error:', error);
                if (error.message === 'Document not found' || error.message === 'File not found on disk') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to download document' });
                }
            }
        });
    }
    deleteDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield DocumentService_1.default.deleteDocument(id);
                res.json({ message: 'Document moved to trash' });
            }
            catch (error) {
                console.error('Delete document error:', error);
                if (error.message === 'Document not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to delete document' });
                }
            }
        });
    }
    // Get deleted documents (Trash)
    getDeletedDocuments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const documents = yield DocumentService_1.default.getDeletedDocuments();
                res.json(documents);
            }
            catch (error) {
                console.error('Get deleted documents error:', error);
                res.status(500).json({ error: 'Failed to fetch deleted documents' });
            }
        });
    }
    // Restore from trash
    restoreDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const document = yield DocumentService_1.default.restoreDocument(id);
                res.json({ message: 'Document restored successfully', document });
            }
            catch (error) {
                console.error('Restore document error:', error);
                if (error.message === 'Document not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to restore document' });
                }
            }
        });
    }
    // Permanent delete
    permanentDeleteDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                yield DocumentService_1.default.permanentDeleteDocument(id);
                res.json({ message: 'Document permanently deleted' });
            }
            catch (error) {
                console.error('Permanent delete error:', error);
                if (error.message === 'Document not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to permanently delete document' });
                }
            }
        });
    }
    // Get storage statistics
    getStorageStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield DocumentService_1.default.getStorageStats();
                res.json(stats);
            }
            catch (error) {
                console.error('Get storage stats error:', error);
                res.status(500).json({ error: 'Failed to fetch storage statistics' });
            }
        });
    }
}
exports.DocumentController = DocumentController;
exports.default = new DocumentController();
