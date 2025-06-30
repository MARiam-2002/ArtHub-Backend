import express from "express";
import dotenv from "dotenv";
import { bootstrap } from "./src/index.router.js";
import { connectDB, closeDatabase, checkDatabaseConnection } from "./DB/connection.js";
import mongoose from "mongoose";
import http from 'http';
import { initializeSocketIO } from "./src/utils/socketService.js";

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '3000');
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 consecutive ports if needed
let server;
let io;

// Initial database connection attempt - don't block serverless cold start
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log("✅ Database connection initialized");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
    // In serverless, we don't want to crash the app on DB connection failure
    // The connection will be retried on subsequent requests
  }
};

// Initialize database connection
initializeDatabase().catch(err => {
  console.error("❌ Initial database connection failed:", err.message);
  // Don't crash the app, we'll retry per-request
});

// Add middleware to check database connection on each request
app.use(async (req, res, next) => {
  // Skip database check for non-API routes and health checks
  if (!req.path.startsWith('/api') || req.path === '/health' || req.path === '/api-docs') {
    return next();
  }
  
  try {
    // Enhanced connection check with ping
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      console.error("❌ Database connection check failed during request");
      return res.status(503).json({
        success: false,
        status: 503,
        message: "الخدمة غير متوفرة",
        error: "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا",
        errorCode: "DB_CONNECTION_ERROR",
        timestamp: new Date().toISOString()
      });
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

// Base API route
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "ArtHub API is running!",
    version: process.env.npm_package_version || "1.0.0",
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    status: "UP",
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint with detailed MongoDB status
app.get("/health", async (req, res) => {
  let dbStatus = "Unknown";
  let dbDetails = {};
  
  try {
    // Check MongoDB connection status
    if (mongoose.connection.readyState === 1) {
      dbStatus = "Connected";
      
      // Get additional MongoDB status info if connected
      try {
        const adminDb = mongoose.connection.db.admin();
        const serverStatus = await adminDb.serverStatus();
        dbDetails = {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections?.current || 0,
          ok: serverStatus.ok === 1
        };
      } catch (dbError) {
        console.error("Error getting MongoDB server status:", dbError);
        dbDetails = { error: "Could not retrieve detailed status" };
      }
    } else {
      // Map readyState to human-readable status
      const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
      dbStatus = states[mongoose.connection.readyState] || "Unknown";
    }
  } catch (error) {
    dbStatus = "Error";
    dbDetails = { error: error.message };
  }
  
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      details: dbDetails
    },
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    serverless: !!process.env.VERCEL || !!process.env.VERCEL_ENV
  });
});

// Start the server for non-serverless environments
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  // Try to bind to the port, and if it fails, increment the port number
  const startServer = (portToUse, attempts = 0) => {
    if (attempts >= MAX_PORT_ATTEMPTS) {
      console.error(`❌ Failed to start server after trying ${MAX_PORT_ATTEMPTS} different ports`);
      return;
    }

    try {
      // Create HTTP server from Express app
      const httpServer = http.createServer(app);
      server = httpServer;
      
      // Initialize Socket.io with the HTTP server
      io = initializeSocketIO(server);
      
      server.listen(portToUse);
      
      server.on('listening', () => {
        const serverEnv = process.env.NODE_ENV || 'development';
        const address = server.address();
        const actualPort = address.port;
        
        console.log(`
    ✅ ArtHub API Server Running!
    🌐 Environment: ${serverEnv}
    🚪 Port: ${actualPort}
    🔌 Socket.IO: Enabled
    📚 API Docs: http://localhost:${actualPort}/api-docs
    ⏱️ Started at: ${new Date().toLocaleString()}
        `);
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${portToUse} is busy, trying port ${portToUse + 1}...`);
          server.close();
          startServer(portToUse + 1, attempts + 1);
        } else {
          console.error('Server error:', err);
        }
      });
    } catch (error) {
      console.error('Error starting server:', error);
    }
  };
  
  // Start with initial port
  startServer(port);
  
  // Handle graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    if (server) {
      server.close(() => {
        console.log('💤 HTTP server closed');
        // Close MongoDB connection if it exists
        closeDatabase()
          .then(() => {
            console.log('💤 Database connection closed');
            process.exit(0);
          })
          .catch(err => {
            console.error('❌ Error closing database:', err);
            process.exit(1);
          });
      });
    } else {
      process.exit(0);
    }
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Continue running but log the error
  });
}

// For serverless functions
export default app;
