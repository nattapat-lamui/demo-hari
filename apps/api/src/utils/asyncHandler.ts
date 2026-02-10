import { Request, Response, NextFunction } from 'express';

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
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
