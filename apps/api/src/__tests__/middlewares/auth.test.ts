import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, requireAdmin, requireOwnerOrAdmin, requireAdminOrFinance, requireAdminOrManager } from '../../middlewares/auth';

// Mock jwt
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token provided', () => {
      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      (mockedJwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(new Error('invalid token'), null);
      });

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next and set user when token is valid', () => {
      const mockUser = { userId: 'user-123', email: 'test@example.com', role: 'EMPLOYEE' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (mockedJwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should return 401 when user not authenticated', () => {
      const middleware = requireRole('HR_ADMIN');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should return 403 when user does not have required role', () => {
      mockRequest.user = { userId: 'user-123', email: 'test@example.com', role: 'EMPLOYEE', employeeId: 'emp-123' };
      const middleware = requireRole('HR_ADMIN');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' })
      );
    });

    it('should call next when user has required role', () => {
      mockRequest.user = { userId: 'user-123', email: 'test@example.com', role: 'HR_ADMIN', employeeId: 'emp-123' };
      const middleware = requireRole('HR_ADMIN');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept multiple roles', () => {
      mockRequest.user = { userId: 'user-123', email: 'test@example.com', role: 'EMPLOYEE', employeeId: 'emp-123' };
      const middleware = requireRole('HR_ADMIN', 'EMPLOYEE');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next for HR_ADMIN users', () => {
      mockRequest.user = { userId: 'user-123', email: 'admin@example.com', role: 'HR_ADMIN', employeeId: 'emp-123' };

      requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for non-admin users', () => {
      mockRequest.user = { userId: 'user-123', email: 'user@example.com', role: 'EMPLOYEE', employeeId: 'emp-123' };

      requireAdmin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireOwnerOrAdmin', () => {
    it('should call next when user is resource owner', () => {
      mockRequest.user = { userId: 'user-123', email: 'user@example.com', role: 'EMPLOYEE', employeeId: 'emp-123' };
      mockRequest.params = { id: 'emp-123' };

      const middleware = requireOwnerOrAdmin((req) => req.params?.id || null);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next when user is admin', () => {
      mockRequest.user = { userId: 'user-123', email: 'admin@example.com', role: 'HR_ADMIN', employeeId: 'admin-emp' };
      mockRequest.params = { id: 'emp-456' };

      const middleware = requireOwnerOrAdmin((req) => req.params?.id || null);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user is not owner and not admin', () => {
      mockRequest.user = { userId: 'user-123', email: 'user@example.com', role: 'EMPLOYEE', employeeId: 'emp-123' };
      mockRequest.params = { id: 'emp-456' };

      const middleware = requireOwnerOrAdmin((req) => req.params?.id || null);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' })
      );
    });
  });

  describe('requireAdminOrFinance', () => {
    it('should call next for HR_ADMIN users', () => {
      mockRequest.user = { userId: 'user-1', email: 'admin@example.com', role: 'HR_ADMIN', employeeId: 'emp-1' };

      requireAdminOrFinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for FINANCE users', () => {
      mockRequest.user = { userId: 'user-2', email: 'finance@example.com', role: 'FINANCE', employeeId: 'emp-2' };

      requireAdminOrFinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for EMPLOYEE users', () => {
      mockRequest.user = { userId: 'user-3', email: 'emp@example.com', role: 'EMPLOYEE', employeeId: 'emp-3' };

      requireAdminOrFinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for MANAGER users', () => {
      mockRequest.user = { userId: 'user-4', email: 'mgr@example.com', role: 'MANAGER', employeeId: 'emp-4' };

      requireAdminOrFinance(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdminOrManager', () => {
    it('should call next for HR_ADMIN users', () => {
      mockRequest.user = { userId: 'user-1', email: 'admin@example.com', role: 'HR_ADMIN', employeeId: 'emp-1' };

      requireAdminOrManager(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next for MANAGER users', () => {
      mockRequest.user = { userId: 'user-5', email: 'mgr@example.com', role: 'MANAGER', employeeId: 'emp-5' };

      requireAdminOrManager(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for EMPLOYEE users', () => {
      mockRequest.user = { userId: 'user-3', email: 'emp@example.com', role: 'EMPLOYEE', employeeId: 'emp-3' };

      requireAdminOrManager(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for FINANCE users', () => {
      mockRequest.user = { userId: 'user-6', email: 'finance@example.com', role: 'FINANCE', employeeId: 'emp-6' };

      requireAdminOrManager(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
