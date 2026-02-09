import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../asyncHandler';
import { Request, Response, NextFunction } from 'express';

describe('asyncHandler', () => {
  it('should call the async function with req, res, next', async () => {
    const mockReq = {} as Request;
    const mockRes = { json: vi.fn() } as unknown as Response;
    const mockNext = vi.fn() as NextFunction;

    const asyncFn = vi.fn().mockResolvedValue(undefined);
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass errors to next function', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn() as NextFunction;

    const error = new Error('Test error');
    const asyncFn = vi.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle successful async operations', async () => {
    const mockReq = {} as Request;
    const mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const mockNext = vi.fn() as NextFunction;

    const asyncFn = async (req: Request, res: Response) => {
      res.status(200).json({ success: true });
    };
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should work with Promise.resolve', async () => {
    const mockReq = {} as Request;
    const mockRes = { json: vi.fn() } as unknown as Response;
    const mockNext = vi.fn() as NextFunction;

    const asyncFn = () => Promise.resolve('data');
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should work with Promise.reject', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn() as NextFunction;

    const error = new Error('Rejected');
    const asyncFn = () => Promise.reject(error);
    const wrappedFn = asyncHandler(asyncFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
