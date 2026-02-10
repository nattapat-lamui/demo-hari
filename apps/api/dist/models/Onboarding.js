"use strict";
// ==========================================
// Database Row Interfaces (snake_case)
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_DOC_STATUSES = exports.VALID_PRIORITIES = exports.VALID_STAGES = void 0;
// ==========================================
// Enums / Validation Constants
// ==========================================
exports.VALID_STAGES = ['Pre-boarding', 'Week 1', 'Month 1'];
exports.VALID_PRIORITIES = ['High', 'Medium', 'Low'];
exports.VALID_DOC_STATUSES = ['Pending', 'Uploaded', 'Approved', 'Rejected'];
