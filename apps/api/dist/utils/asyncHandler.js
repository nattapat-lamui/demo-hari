"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 *
 * @example
 * router.get('/employees', asyncHandler(async (req, res) => {
 *   const employees = await EmployeeService.getAll();
 *   res.json(employees);
 * }));
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
