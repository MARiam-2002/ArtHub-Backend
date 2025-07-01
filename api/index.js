import express from 'express';
import dotenv from 'dotenv';
import { bootstrap } from '../src/index.router.js';
import { connectDB } from '../DB/connection.js';
import mongoose from 'mongoose';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

// Create Express app
const app = express();

// Initialize database connection
ensureDatabaseConnection().catch(err => {
  console.error("❌ Initial database connection failed:", err.message);
});

// Add middleware to check database connection on each request
app.use(async (req, res, next) => {
  // Skip database check for health checks and diagnostics
  if (req.path === '/health' || 
      req.path === '/api/keepalive' || 
      req.path === '/api/db-test' ||
      req.path === '/api/mongo-debug' ||
      req.path === '/api/direct-connect' ||
      req.path === '/api-docs') {
    return next();
  }
  
  try {
    // Check if we're connected to MongoDB
    if (mongoose.connection.readyState !== 1) {
      // Try to connect
      const reconnected = await ensureDatabaseConnection(true);
      
      if (!reconnected) {
        return res.status(503).json({
          success: false,
          status: 503,
          message: "الخدمة غير متوفرة",
          error: "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا",
          errorCode: "DB_CONNECTION_ERROR",
          timestamp: new Date().toISOString()
        });
      }
    }
    
    next();
  } catch (err) {
    console.error("❌ Database connection error during request:", err);
    return res.status(503).json({
      success: false,
      status: 503,
      message: "الخدمة غير متوفرة",
      error: "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا",
      errorCode: "DB_CONNECTION_ERROR",
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize routes and middleware
bootstrap(app, express);

// Export the Express API for Vercel Serverless Functions
export default app; 