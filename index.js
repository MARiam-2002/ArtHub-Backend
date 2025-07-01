import express from "express";
import dotenv from "dotenv";
import { bootstrap } from "./src/index.router.js";
import { connectDB, closeDatabase, checkDatabaseConnection } from "./DB/connection.js";
import mongoose from "mongoose";
import http from 'http';
import { initializeSocketIO } from "./src/utils/socketService.js";
import { ensureDatabaseConnection } from "./src/utils/mongodbUtils.js";

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '3000');
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 consecutive ports if needed
let server;
let io;

// Initial database connection attempt - don't block serverless cold start
const initializeDatabase = async () => {
  // Skip database connection in development if MOCK_DB is set
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_DB === 'true') {
    console.log("🧪 Running in mock database mode - skipping MongoDB connection");
    return;
  }
  
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
  if (!req.path.startsWith('/api') || 
      req.path === '/health' || 
      req.path === '/api/keepalive' || 
      req.path === '/api/db-test' ||
      req.path === '/api-docs') {
    return next();
  }
  
  // Skip database check in development with mock mode
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_DB === 'true') {
    return next();
  }
  
  try {
    // Enhanced connection check with ping and retry
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      console.error("❌ Database connection check failed during request");
      
      // Try one more time with force reconnect
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
        const pingResult = await adminDb.ping();
        
        dbDetails = {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections?.current || 0,
          ok: serverStatus.ok === 1,
          ping: pingResult.ok === 1,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          options: {
            maxPoolSize: mongoose.connection.options?.maxPoolSize,
            socketTimeoutMS: mongoose.connection.options?.socketTimeoutMS,
            connectTimeoutMS: mongoose.connection.options?.connectTimeoutMS,
          }
        };
      } catch (dbError) {
        console.error("Error getting MongoDB server status:", dbError);
        dbDetails = { error: "Could not retrieve detailed status", message: dbError.message };
      }
    } else {
      // Map readyState to human-readable status
      const states = ["Disconnected", "Connected", "Connecting", "Disconnecting"];
      dbStatus = states[mongoose.connection.readyState] || "Unknown";
      
      // Include connection URL info (without credentials)
      if (process.env.CONNECTION_URL) {
        try {
          const url = new URL(process.env.CONNECTION_URL);
          dbDetails.host = url.hostname;
          dbDetails.protocol = url.protocol;
          dbDetails.database = url.pathname.substring(1);
        } catch (e) {
          dbDetails.error = "Invalid connection URL format";
        }
      }
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
      readyState: mongoose.connection.readyState,
      details: dbDetails
    },
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    serverless: !!process.env.VERCEL || !!process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown'
  });
});

// Add database test endpoint
app.get("/api/db-test", async (req, res) => {
  try {
    // Test database connection
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      // Try to connect
      console.log("🔄 Database not connected, attempting to connect...");
      await connectDB();
    }
    
    // Verify connection with a simple find operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Test a simple find operation on the users collection
    let userTestResult = { status: "skipped" };
    try {
      const usersCollection = mongoose.connection.db.collection('users');
      const userCount = await usersCollection.countDocuments({}, { maxTimeMS: 5000 });
      userTestResult = { 
        status: "success", 
        count: userCount,
        message: "Successfully queried users collection"
      };
    } catch (userError) {
      userTestResult = { 
        status: "error", 
        message: userError.message,
        error: userError.name
      };
    }
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.db.databaseName,
        collections: collections.length,
        collectionNames: collections.map(c => c.name),
        userTest: userTestResult
      },
      environment: {
        node: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
        serverless: !!process.env.VERCEL || !!process.env.VERCEL_ENV
      }
    });
  } catch (error) {
    console.error("❌ Database test failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString(),
      connectionState: mongoose.connection.readyState
    });
  }
});

// Add keepalive endpoint for preventing cold starts
app.get("/api/keepalive", async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    
    if (isConnected) {
      // Test connection with a ping
      try {
        await mongoose.connection.db.admin().ping();
        res.status(200).json({
          status: 'ok',
          message: 'Server is alive',
          database: 'connected',
          timestamp: new Date().toISOString()
        });
      } catch (pingError) {
        // Ping failed, try to reconnect
        console.log("⚠️ Database ping failed, attempting to reconnect");
        await ensureDatabaseConnection(true);
        
        res.status(200).json({
          status: 'ok',
          message: 'Server is alive, reconnected to database after ping failure',
          database: 'reconnected',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Try to reconnect
      try {
        await ensureDatabaseConnection(true);
        
        res.status(200).json({
          status: 'ok',
          message: 'Server is alive, reconnected to database',
          database: 'reconnected',
          timestamp: new Date().toISOString()
        });
      } catch (reconnectError) {
        res.status(503).json({
          status: 'degraded',
          message: 'Server is alive but database connection failed',
          database: 'disconnected',
          error: reconnectError.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error in keepalive endpoint:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking server status',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
