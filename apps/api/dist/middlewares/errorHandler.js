"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiError = exports.notFoundHandler = exports.errorHandler = void 0;
const multer_1 = __importDefault(require("multer"));
/**
 * Global error handler middleware
 * Catches all errors thrown in route handlers and provides consistent error responses
 */
// Fields to redact from request body before logging
const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'secret', 'currentPassword', 'newPassword'];
function sanitizeBody(body) {
    if (!body || typeof body !== 'object')
        return body;
    const sanitized = Object.assign({}, body);
    for (const field of SENSITIVE_FIELDS) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
}
const errorHandler = (err, req, res, next) => {
    var _a;
    // Log error for debugging (server-side only, with sensitive fields redacted)
    console.error('API Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: sanitizeBody(req.body),
        query: req.query,
    });
    // Handle multer / file upload errors as 400
    if (err instanceof multer_1.default.MulterError || ((_a = err.message) === null || _a === void 0 ? void 0 : _a.startsWith('File type not allowed'))) {
        res.status(400).json({ error: err.message });
        return;
    }
    // Determine status code
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : err.message;
    // Never send stack traces or internal details to the client
    res.status(statusCode).json({
        error: message,
    });
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 * Called when no route matches the request
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.url,
        method: req.method,
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Create an API error with status code
 */
const createApiError = (message, statusCode = 500, details) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
};
exports.createApiError = createApiError;
