import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check environment variables
    const envCheck = {
      CONNECTION_URL: process.env.CONNECTION_URL ? 'Set' : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      TOKEN_KEY: process.env.TOKEN_KEY ? 'Set' : 'Missing'
    };
    
    console.log('📊 Environment check:', envCheck);
    
    // Try to connect to MongoDB
    if (process.env.CONNECTION_URL) {
      try {
        await mongoose.connect(process.env.CONNECTION_URL, {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: 1,
          minPoolSize: 0,
          bufferCommands: false,
          autoIndex: false
        });
        
        console.log('✅ Database connection successful');
        
        res.json({
          success: true,
          message: 'Database connection successful',
          environment: envCheck,
          dbState: mongoose.connection.readyState,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        
        res.status(500).json({
          success: false,
          message: 'Database connection failed',
          error: dbError.message,
          environment: envCheck,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'CONNECTION_URL environment variable is missing',
        environment: envCheck,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ General error:', error);
    res.status(500).json({
      success: false,
      message: 'General error occurred',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test basic imports
app.get('/api/import-test', (req, res) => {
  try {
    // Test importing key modules
    const modules = {
      express: '✅',
      mongoose: '✅',
      dotenv: '✅'
    };
    
    // Test if we can import our modules
    try {
      import('./src/utils/asyncHandler.js').then(() => {
        modules.asyncHandler = '✅';
      }).catch(() => {
        modules.asyncHandler = '❌';
      });
    } catch (e) {
      modules.asyncHandler = '❌';
    }
    
    res.json({
      success: true,
      message: 'Import test completed',
      modules,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Import test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Debug server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`🗄️ DB test: http://localhost:${port}/api/db-test`);
  console.log(`📦 Import test: http://localhost:${port}/api/import-test`);
}); 