import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/arthub_test';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

// Mock external services globally
jest.mock('../src/utils/cloudinary.js', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    secure_url: 'https://test-cloudinary.com/test-image.jpg',
    public_id: 'test-image-id'
  }),
  deleteImage: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/utils/sendEmails.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/utils/pushNotifications.js', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(true),
  updateUserFCMToken: jest.fn().mockResolvedValue(true),
  sendNotificationToFollowers: jest.fn().mockResolvedValue(true)
}));

jest.mock('../src/utils/firebaseAdmin.js', () => ({
  default: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-firebase-uid',
        email: 'test@firebase.com',
        name: 'Test Firebase User'
      })
    })
  }
}));

jest.mock('../src/utils/socketService.js', () => ({
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn()
}));

// Global test utilities
global.createTestUser = async (userModel, overrides = {}) => {
  return await userModel.create({
    displayName: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    isEmailVerified: true,
    ...overrides
  });
};

global.createMockRequest = (overrides = {}) => ({
  user: { _id: 'test-user-id' },
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    success: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis()
  };
  return res;
};

global.createMockNext = () => jest.fn();

// Database setup and teardown
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/arthub_test');
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Clean up between tests
beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Test that setup is working
test('setup is working', () => {
  expect(true).toBe(true);
});
