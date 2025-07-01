export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['./__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['src/**/*.js', '!src/swagger/**', '!**/node_modules/**'],
  coverageDirectory: './coverage',
  verbose: true,
  // Handle ESM in Jest
  transformIgnorePatterns: [],
  // For MongoDB Memory Server
  testTimeout: 30000,
  // Fix module resolution for ESM
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['js', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Mock all modules by default
  automock: false,
  // Clear mocks between tests
  clearMocks: true
};
