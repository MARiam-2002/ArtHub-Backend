import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { asyncHandler, createError, validateRequest } from '../../src/utils/asyncHandler.js';

describe('Utility Functions - Unit Tests', () => {
  describe('asyncHandler', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        body: { test: 'data' },
        path: '/test',
        method: 'GET'
      };

      res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      next = jest.fn();

      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should pass the result to next() when promise resolves', async () => {
      // Create a mock handler that resolves
      const mockHandler = jest.fn().mockResolvedValue('result');

      // Wrap it with asyncHandler
      const wrappedHandler = asyncHandler(mockHandler);

      // Call the wrapped handler
      await wrappedHandler(req, res, next);

      // Assertions
      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass error to next() when promise rejects', async () => {
      // Create a mock error
      const mockError = new Error('Test error');

      // Create a mock handler that rejects
      const mockHandler = jest.fn().mockRejectedValue(mockError);

      // Wrap it with asyncHandler
      const wrappedHandler = asyncHandler(mockHandler);

      // Call the wrapped handler
      await wrappedHandler(req, res, next);

      // Assertions
      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('should not call next() if headers are already sent', async () => {
      // Set headersSent to true
      res.headersSent = true;

      // Create a mock error
      const mockError = new Error('Test error');

      // Create a mock handler that rejects
      const mockHandler = jest.fn().mockRejectedValue(mockError);

      // Mock console.error
      console.error = jest.fn();

      // Wrap it with asyncHandler
      const wrappedHandler = asyncHandler(mockHandler);

      // Call the wrapped handler
      await wrappedHandler(req, res, next);

      // Assertions
      expect(mockHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createError', () => {
    it('should create an error with the specified message and status code', () => {
      const error = createError('Test error', 400);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe(400);
    });

    it('should use default status code if not provided', () => {
      const error = createError('Test error');

      expect(error.cause).toBe(500);
    });

    it('should add details if provided', () => {
      const details = { field: 'Invalid value' };
      const error = createError('Test error', 400, details);

      expect(error.details).toEqual(details);
    });
  });

  describe('validateRequest', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
      req = {
        body: { name: 'Test', email: 'test@example.com' },
        query: { page: '1', limit: '10' },
        params: { id: '123' }
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      next = jest.fn();

      // Reset all mocks
      jest.clearAllMocks();
    });

    it('should call next() if validation passes', () => {
      // Create a mock schema that validates successfully
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          error: null,
          value: req.body
        })
      };

      // Create middleware
      const middleware = validateRequest(mockSchema);

      // Call middleware
      middleware(req, res, next);

      // Assertions
      expect(mockSchema.validate).toHaveBeenCalledWith(req.body, expect.any(Object));
      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next() with error if validation fails', () => {
      // Create a mock validation error
      const mockError = {
        details: [
          { context: { key: 'name' }, message: 'Name is required' },
          { context: { key: 'email' }, message: 'Email is invalid' }
        ]
      };

      // Create a mock schema that fails validation
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          error: mockError,
          value: req.body
        })
      };

      // Create middleware
      const middleware = validateRequest(mockSchema);

      // Call middleware
      middleware(req, res, next);

      // Assertions
      expect(mockSchema.validate).toHaveBeenCalledWith(req.body, expect.any(Object));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'خطأ في البيانات المدخلة',
          cause: 400,
          details: {
            name: 'Name is required',
            email: 'Email is invalid'
          }
        })
      );
    });

    it('should validate query parameters when source is "query"', () => {
      // Create a mock schema that validates successfully
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          error: null,
          value: req.query
        })
      };

      // Create middleware
      const middleware = validateRequest(mockSchema, 'query');

      // Call middleware
      middleware(req, res, next);

      // Assertions
      expect(mockSchema.validate).toHaveBeenCalledWith(req.query, expect.any(Object));
      expect(next).toHaveBeenCalled();
    });
  });
});
