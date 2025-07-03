import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import models
import userModel from '../../DB/models/user.model.js';
import imageModel from '../../DB/models/image.model.js';

// Import routers and middleware
import imageRouter from '../../src/modules/image/image.router.js';
import { responseMiddleware } from '../../src/middleware/response.middleware.js';
import { globalErrorHandling } from '../../src/middleware/error.middleware.js';
import { authenticate as isAuthenticated } from '../../src/middleware/auth.middleware.js';

// Mock external services
jest.mock('../../src/utils/cloudinary.js', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    secure_url: 'https://test-cloudinary-url.com/image.jpg',
    public_id: 'test_public_id'
  }),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' })
}));

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

describe('Image API - Integration Tests', () => {
  let mongoServer;
  let app;
  let testUser;
  let authToken;
  let testImagePath;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);

    // Create test image file
    testImagePath = path.join(__dirname, 'test-image.jpg');
    // Create a simple test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      const buffer = Buffer.alloc(1024);
      fs.writeFileSync(testImagePath, buffer);
    }

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);

    // Mock authentication middleware for testing
    app.use('/api/image', (req, res, next) => {
      if (req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.TOKEN_KEY);
          req.user = { id: decoded.id, role: decoded.role };
          next();
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'غير مصرح به',
            error: 'رمز المصادقة غير صالح أو منتهي الصلاحية'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'غير مصرح به',
          error: 'رمز المصادقة مطلوب'
        });
      }
    });

    app.use('/api/image', imageRouter);
    app.use(globalErrorHandling);

    // Create test user
    const hashedPassword = await bcryptjs.hash('Password123!', 10);
    testUser = await userModel.create({
      displayName: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      phoneNumber: '+9665xxxxxxxx',
      role: 'user'
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.TOKEN_KEY
    );
  });

  afterAll(async () => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Disconnect and stop MongoDB Memory Server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear images collection before each test
    await imageModel.deleteMany({});
  });

  describe('POST /api/image/upload', () => {
    it('should upload an image successfully', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Image')
        .field('description', 'This is a test image')
        .field('tags', 'test,image')
        .field('applyWatermark', 'true')
        .attach('images', testImagePath)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('images');
      expect(response.body.data.images.length).toBe(1);
      expect(response.body.data.images[0]).toHaveProperty('_id');
      expect(response.body.data.images[0].title).toBe('Test Image');

      // Verify image was created in database
      const createdImage = await imageModel.findById(response.body.data.images[0]._id);
      expect(createdImage).toBeTruthy();
      expect(createdImage.title).toBe('Test Image');

      // Verify user was updated with image reference
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.images).toContainEqual(mongoose.Types.ObjectId(createdImage._id));
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .field('title', 'Test Image')
        .field('description', 'This is a test image')
        .attach('images', testImagePath)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('غير مصرح به');
    });

    it('should return 400 if no images are provided', async () => {
      const response = await request(app)
        .post('/api/image/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'Test Image')
        .field('description', 'This is a test image')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('صور');
    });
  });
});
