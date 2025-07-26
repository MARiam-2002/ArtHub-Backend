// Debug script for Vercel deployment issues
import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      CONNECTION_URL: process.env.CONNECTION_URL ? 'SET' : 'NOT_SET',
      TOKEN_KEY: process.env.TOKEN_KEY ? 'SET' : 'NOT_SET',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT_SET'
    }
  });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({
      success: true,
      database: {
        state: states[connectionState] || 'unknown',
        readyState: connectionState,
        connectionUrl: process.env.CONNECTION_URL ? 'SET' : 'NOT_SET'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Test import endpoint
app.get('/api/test-imports', (req, res) => {
  try {
    // Test basic imports
    const testImports = {
      express: typeof express,
      mongoose: typeof mongoose,
      path: typeof path,
      dotenv: typeof dotenv
    };
    
    res.json({
      success: true,
      imports: testImports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Debug server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🗄️ DB test: http://localhost:${port}/api/db-test`);
  console.log(`📦 Import test: http://localhost:${port}/api/test-imports`);
});

export default app; 