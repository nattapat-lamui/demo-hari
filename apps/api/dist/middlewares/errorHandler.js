"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiError = exports.notFoundHandler = exports.errorHandler = void 0;
/**
 * Global error handler middleware
 * Catches all errors thrown in route handlers and provides consistent error responses
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('API Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
    });
    // Determine status code
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Send error response
    res.status(statusCode).json(Object.assign({ error: message }, (process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details,
    })));
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
