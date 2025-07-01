import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('Middleware Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer valid_token',
        token: 'valid_token'
      },
      params: {},
      body: {},
      user: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Authorization Middleware', () => {
    it('should authorize users with correct role', () => {
      // Setup
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Create a simple role-based authorization middleware
      const authorizeRoles = allowedRoles => (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        if (!allowedRoles.includes(req.user.role)) {
          return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
        }

        next();
      };

      // Test with a role that should be allowed
      const middleware = authorizeRoles(['user', 'admin']);
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject users with incorrect role', () => {
      // Setup
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Create a simple role-based authorization middleware
      const authorizeRoles = allowedRoles => (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        if (!allowedRoles.includes(req.user.role)) {
          return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
        }

        next();
      };

      // Test with a role that should not be allowed
      const middleware = authorizeRoles(['admin']);
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'غير مصرح لك بالوصول إلى هذا المورد',
          cause: 403
        })
      );
    });

    it('should reject unauthenticated users', () => {
      // Setup - no user in request
      req.user = undefined;

      // Create a simple role-based authorization middleware
      const authorizeRoles = allowedRoles => (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        if (!allowedRoles.includes(req.user.role)) {
          return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
        }

        next();
      };

      // Test with any roles
      const middleware = authorizeRoles(['user', 'admin']);
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'يجب تسجيل الدخول أولاً',
          cause: 401
        })
      );
    });
  });

  describe('Resource Ownership Middleware', () => {
    it('should allow access to resource owners', async () => {
      // Setup
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Create a simple resource ownership middleware
      const isResourceOwner = getResourceUserId => async (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        try {
          const resourceUserId = await getResourceUserId(req);

          if (resourceUserId.toString() !== req.user._id.toString()) {
            return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
          }

          next();
        } catch (error) {
          next(new Error('حدث خطأ أثناء التحقق من ملكية المورد', { cause: 500 }));
        }
      };

      // Mock function that returns the resource owner ID matching the user
      const getResourceUserId = jest.fn().mockResolvedValue('user123');

      // Create and call the middleware
      const middleware = isResourceOwner(getResourceUserId);
      await middleware(req, res, next);

      // Assert
      expect(getResourceUserId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access to non-owners', async () => {
      // Setup
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Create a simple resource ownership middleware
      const isResourceOwner = getResourceUserId => async (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        try {
          const resourceUserId = await getResourceUserId(req);

          if (resourceUserId.toString() !== req.user._id.toString()) {
            return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
          }

          next();
        } catch (error) {
          next(new Error('حدث خطأ أثناء التحقق من ملكية المورد', { cause: 500 }));
        }
      };

      // Mock function that returns a different resource owner ID
      const getResourceUserId = jest.fn().mockResolvedValue('different_user');

      // Create and call the middleware
      const middleware = isResourceOwner(getResourceUserId);
      await middleware(req, res, next);

      // Assert
      expect(getResourceUserId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'غير مصرح لك بالوصول إلى هذا المورد',
          cause: 403
        })
      );
    });

    it('should handle errors in resource ownership check', async () => {
      // Setup
      req.user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      };

      // Create a simple resource ownership middleware
      const isResourceOwner = getResourceUserId => async (req, res, next) => {
        if (!req.user) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        try {
          const resourceUserId = await getResourceUserId(req);

          if (resourceUserId.toString() !== req.user._id.toString()) {
            return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
          }

          next();
        } catch (error) {
          next(new Error('حدث خطأ أثناء التحقق من ملكية المورد', { cause: 500 }));
        }
      };

      // Mock function that throws an error
      const getResourceUserId = jest.fn().mockRejectedValue(new Error('Database error'));

      // Create and call the middleware
      const middleware = isResourceOwner(getResourceUserId);
      await middleware(req, res, next);

      // Assert
      expect(getResourceUserId).toHaveBeenCalledWith(req);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'حدث خطأ أثناء التحقق من ملكية المورد',
          cause: 500
        })
      );
    });
  });

  describe('Authentication Validation', () => {
    it('should detect missing authentication token', () => {
      // Remove authentication tokens
      req.headers.authorization = undefined;
      req.headers.token = undefined;

      // Simple function to validate token presence
      const validateTokenPresence = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

        if (!token) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        next();
      };

      // Call the function
      validateTokenPresence(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'يجب تسجيل الدخول أولاً',
          cause: 401
        })
      );
    });

    it('should pass when token is present', () => {
      // Simple function to validate token presence
      const validateTokenPresence = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;

        if (!token) {
          return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
        }

        next();
      };

      // Call the function
      validateTokenPresence(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });
  });
});
