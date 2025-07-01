// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TOKEN_KEY = 'test_secret_key';
process.env.SALT_ROUND = '10';

// Make Jest available globally for ESM
import { jest } from '@jest/globals';
global.jest = jest;

// Silence console logs during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here
});

// Add a dummy test to avoid "Your test suite must contain at least one test" error
test('setup is working', () => {
  expect(true).toBe(true);
});

// Note: Mock definitions moved to individual test files for ESM compatibility
