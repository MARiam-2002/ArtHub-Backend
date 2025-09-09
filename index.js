import express from 'express';
import dotenv from 'dotenv';
import { bootstrap } from './src/index.router.js';
import { connectDB, closeDatabase, checkDatabaseConnection } from './DB/connection.js';
import mongoose from 'mongoose';
import http from 'http';
import { initializeSocketIO } from './src/utils/socketService.js';
import { ensureDatabaseConnection } from './src/utils/mongodbUtils.js';
import { initScheduledJobs, stopScheduledJobs } from './src/utils/cron.js';
import { initializeRedis, shutdownRedis } from './src/utils/redisInit.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient } from 'mongodb';

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '3000');
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 consecutive ports if needed
let server;
let io;
let scheduledJobs;

// Initial database connection attempt - don't block serverless cold start
const initializeDatabase = async () => {
  // Skip database connection in development if MOCK_DB is set
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_DB === 'true') {
    console.log('🧪 Running in mock database mode - skipping MongoDB connection');
    return;
  }

  try {
    await connectDB();
    console.log('✅ Database connection initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    // In serverless, we don't want to crash the app on DB connection failure
    // The connection will be retried on subsequent requests
  }
};

// Initialize Redis connection
const initializeRedisConnection = async () => {
  try {
    await initializeRedis();
  } catch (err) {
    console.error('❌ Redis initialization error:', err);
    // Continue without Redis cache
  }
};

// Initialize database and Redis connections
initializeDatabase().catch(err => {
  console.error('❌ Initial database connection failed:', err.message);
  // Don't crash the app, we'll retry per-request
});

initializeRedisConnection().catch(err => {
  console.error('❌ Initial Redis connection failed:', err.message);
  // Continue without Redis cache
});

// Add middleware to check database connection on each request
app.use(async (req, res, next) => {
  // Skip database check for non-API routes and health checks
  if (
    !req.path.startsWith('/api') ||
    req.path === '/health' ||
    req.path === '/api/health' ||
    req.path === '/api/keepalive' ||
    req.path === '/api/db-test' ||
    req.path === '/api/mongo-debug' ||
    req.path === '/api/direct-connect' ||
    req.path === '/api/api-routes' ||
    req.path === '/api-docs' ||
    req.path === '/api-docs/' ||
    req.path.startsWith('/api-docs/')
  ) {
    return next();
  }

  // Skip database check in development with mock mode
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_DB === 'true') {
    return next();
  }

  // Skip database check if CONNECTION_URL is not set
  if (!process.env.CONNECTION_URL) {
    console.warn('⚠️ CONNECTION_URL not set, skipping database checks');
    return next();
  }

  try {
    // Enhanced connection check with ping and retry
    const isConnected = await checkDatabaseConnection();

    if (!isConnected) {
      console.error('❌ Database connection check failed during request');

      // Try one more time with force reconnect
      const reconnected = await ensureDatabaseConnection(true);

      if (!reconnected) {
        console.error('❌ Database reconnection failed, but continuing request');
        // Don't block the request, just log the error
        // return res.status(503).json({
        //   success: false,
        //   status: 503,
        //   message: 'الخدمة غير متوفرة',
        //   error: 'خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا',
        //   errorCode: 'DB_CONNECTION_ERROR',
        //   timestamp: new Date().toISOString()
        // });
      }
    }

    next();
  } catch (err) {
    console.error('❌ Database connection error during request:', err);
    // Don't block the request, just log the error
    // return res.status(503).json({
    //   success: false,
    //   status: 503,
    //   message: 'الخدمة غير متوفرة',
    //   error: 'خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا',
    //   errorCode: 'DB_CONNECTION_ERROR',
    //   timestamp: new Date().toISOString()
    // });
    next();
  }
});

// Initialize routes and middleware
bootstrap(app, express);

// Base API route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ArtHub API is running!',
    version: process.env.npm_package_version || '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Simple API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    status: 'UP'
  });
});

// Enhanced health check endpoint with detailed MongoDB status
app.get('/health', async (req, res) => {
  let dbStatus = 'Unknown';
  let dbDetails = {};

  try {
    // Check MongoDB connection status
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'Connected';

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
            connectTimeoutMS: mongoose.connection.options?.connectTimeoutMS
          }
        };
      } catch (dbError) {
        console.error('Error getting MongoDB server status:', dbError);
        dbDetails = { error: 'Could not retrieve detailed status', message: dbError.message };
      }
    } else {
      // Map readyState to human-readable status
      const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
      dbStatus = states[mongoose.connection.readyState] || 'Unknown';

      // Include connection URL info (without credentials)
      if (process.env.CONNECTION_URL) {
        try {
          const url = new URL(process.env.CONNECTION_URL);
          dbDetails.host = url.hostname;
          dbDetails.protocol = url.protocol;
          dbDetails.database = url.pathname.substring(1);
        } catch (e) {
          dbDetails.error = 'Invalid connection URL format';
        }
      }
    }
  } catch (error) {
    dbStatus = 'Error';
    dbDetails = { error: error.message };
  }

  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
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
app.get('/api/db-test', async (req, res) => {
  try {
    // Test database connection
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      // Try to connect
      console.log('🔄 Database not connected, attempting to connect...');
      await connectDB();
    }

    // Verify connection with a simple find operation
    const collections = await mongoose.connection.db.listCollections().toArray();

    // Test a simple find operation on the users collection
    let userTestResult = { status: 'skipped' };
    try {
      const usersCollection = mongoose.connection.db.collection('users');
      const userCount = await usersCollection.countDocuments({}, { maxTimeMS: 5000 });
      userTestResult = {
        status: 'success',
        count: userCount,
        message: 'Successfully queried users collection'
      };
    } catch (userError) {
      userTestResult = {
        status: 'error',
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
    console.error('❌ Database test failed:', error);
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
app.get('/api/keepalive', async (req, res) => {
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
        console.log('Database ping failed:', pingError.message);

        // Try to reconnect
        const reconnected = await ensureDatabaseConnection(true);

        res.status(reconnected ? 200 : 503).json({
          status: reconnected ? 'ok' : 'degraded',
          message: reconnected
            ? 'Server is alive, reconnected after ping failure'
            : 'Server is alive but database connection failed',
          database: reconnected ? 'reconnected' : 'disconnected',
          error: reconnected ? undefined : pingError.message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Try to reconnect
      const reconnected = await ensureDatabaseConnection(true);

      res.status(reconnected ? 200 : 503).json({
        status: reconnected ? 'ok' : 'degraded',
        message: reconnected
          ? 'Server is alive, reconnected to database'
          : 'Server is alive but database connection failed',
        database: reconnected ? 'reconnected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
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

// MongoDB connection debug endpoint
app.get('/api/mongo-debug', async (req, res) => {
  try {
    // Get current connection state
    const currentState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const connectionState = states[currentState] || 'unknown';

    // Try to connect if not connected
    let connectionResult = null;
    if (currentState !== 1) {
      try {
        console.log('Attempting to connect to MongoDB...');
        await connectDB();
        connectionResult = {
          success: true,
          message: 'Successfully connected to MongoDB'
        };
      } catch (error) {
        connectionResult = {
          success: false,
          message: 'Failed to connect to MongoDB',
          error: error.message
        };
      }
    }

    // Get connection string info (without credentials)
    let connectionInfo = {};
    if (process.env.CONNECTION_URL) {
      try {
        const url = new URL(process.env.CONNECTION_URL);
        connectionInfo = {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
          database: url.pathname.substring(1),
          options: url.search
        };
      } catch (urlError) {
        connectionInfo = {
          error: 'Invalid connection URL format',
          message: urlError.message
        };
      }
    } else {
      connectionInfo = {
        error: 'CONNECTION_URL environment variable not set'
      };
    }

    // Get MongoDB options from environment variables
    const mongodbOptions = {
      MONGODB_CONNECTION_TIMEOUT: process.env.MONGODB_CONNECTION_TIMEOUT || 'not set',
      MONGODB_SOCKET_TIMEOUT: process.env.MONGODB_SOCKET_TIMEOUT || 'not set',
      MONGODB_SERVER_SELECTION_TIMEOUT: process.env.MONGODB_SERVER_SELECTION_TIMEOUT || 'not set',
      MONGODB_MAX_RETRY_ATTEMPTS: process.env.MONGODB_MAX_RETRY_ATTEMPTS || 'not set',
      MONGODB_BASE_RETRY_DELAY: process.env.MONGODB_BASE_RETRY_DELAY || 'not set'
    };

    // Get Vercel environment information
    const vercelInfo = {
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set'
    };

    // Try a simple ping if connected
    let pingResult = null;
    if (currentState === 1) {
      try {
        const startTime = Date.now();
        await mongoose.connection.db.admin().ping();
        const endTime = Date.now();
        pingResult = {
          success: true,
          latency: `${endTime - startTime}ms`
        };
      } catch (pingError) {
        pingResult = {
          success: false,
          error: pingError.message
        };
      }
    }

    // Return debug information
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      mongodb: {
        connectionState,
        readyState: currentState,
        connectionResult: connectionResult || 'Already connected',
        connectionInfo,
        ping: pingResult,
        options: mongodbOptions
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        vercel: vercelInfo,
        platform: process.platform,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('MongoDB debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting MongoDB debug information',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Direct MongoDB connection test endpoint
app.get('/api/direct-connect', async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_REGION: process.env.VERCEL_REGION || 'not set'
    },
    connectionTests: {
      mongoose: null,
      nativeDriver: null
    }
  };

  try {
    // Get connection string info (without credentials)
    if (process.env.CONNECTION_URL) {
      try {
        const url = new URL(process.env.CONNECTION_URL);
        results.connectionInfo = {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || (url.protocol === 'mongodb:' ? '27017' : 'N/A'),
          database: url.pathname.substring(1),
          isSrv: url.protocol.includes('srv')
        };
      } catch (urlError) {
        results.connectionInfo = {
          error: 'Invalid connection URL format',
          message: urlError.message
        };
      }
    } else {
      results.connectionInfo = {
        error: 'CONNECTION_URL environment variable not set'
      };
      return res.status(500).json({
        success: false,
        message: 'CONNECTION_URL environment variable not set',
        results
      });
    }

    // Test 1: Mongoose connection
    try {
      const startTime = Date.now();

      // Only connect if not already connected
      if (mongoose.connection.readyState !== 1) {
        // Set connection options
        const mongooseOptions = {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: 1,
          minPoolSize: 0,
          bufferCommands: false,
          autoIndex: false
        };

        await mongoose.connect(process.env.CONNECTION_URL, mongooseOptions);

        // Ping to verify connection
        await mongoose.connection.db.admin().ping();

        const endTime = Date.now();
        results.connectionTests.mongoose = {
          success: true,
          latency: `${endTime - startTime}ms`,
          readyState: mongoose.connection.readyState
        };

        // Close connection to avoid keeping it open
        await mongoose.connection.close();
      } else {
        results.connectionTests.mongoose = {
          success: true,
          message: 'Already connected',
          readyState: mongoose.connection.readyState
        };
      }
    } catch (mongooseError) {
      results.connectionTests.mongoose = {
        success: false,
        error: mongooseError.message,
        name: mongooseError.name,
        stack: process.env.NODE_ENV === 'development' ? mongooseError.stack : undefined
      };
    }

    // Test 2: Native MongoDB driver connection
    try {
      const startTime = Date.now();

      // Create new client
      const client = new MongoClient(process.env.CONNECTION_URL, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 1,
        minPoolSize: 0
      });

      // Connect and ping
      await client.connect();
      await client.db().admin().ping();

      const endTime = Date.now();
      results.connectionTests.nativeDriver = {
        success: true,
        latency: `${endTime - startTime}ms`
      };

      // Close connection
      await client.close();
    } catch (nativeError) {
      results.connectionTests.nativeDriver = {
        success: false,
        error: nativeError.message,
        name: nativeError.name,
        stack: process.env.NODE_ENV === 'development' ? nativeError.stack : undefined
      };
    }

    // Return results
    const overallSuccess =
      results.connectionTests.mongoose?.success || results.connectionTests.nativeDriver?.success;

    return res.status(overallSuccess ? 200 : 500).json({
      success: overallSuccess,
      message: overallSuccess
        ? 'At least one connection test succeeded'
        : 'All connection tests failed',
      results
    });
  } catch (error) {
    console.error('Direct connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running connection tests',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      results
    });
  }
});

// API routes endpoint
app.get('/api/api-routes', async (req, res) => {
  try {
    // Get current directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = __dirname;

    // Function to extract routes from a router file
    const extractRoutes = filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const routes = [];

        // Match router.METHOD patterns
        const routerMethodRegex = /router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g;
        let match;
        while ((match = routerMethodRegex.exec(content)) !== null) {
          routes.push({
            method: match[1].toUpperCase(),
            path: match[2]
          });
        }

        // Match app.use patterns for sub-routers
        const appUseRegex = /app\.use\(['"]([^'"]+)['"]/g;
        while ((match = appUseRegex.exec(content)) !== null) {
          routes.push({
            type: 'router',
            basePath: match[1]
          });
        }

        return routes;
      } catch (error) {
        console.error(`Error extracting routes from ${filePath}:`, error);
        return [];
      }
    };

    // Collect API routes from index.router.js
    const indexRouterPath = path.join(projectRoot, 'src', 'index.router.js');
    const mainRoutes = extractRoutes(indexRouterPath);

    // Collect API routes from module routers
    const moduleRoutes = {};
    const modulesDir = path.join(projectRoot, 'src', 'modules');

    if (fs.existsSync(modulesDir)) {
      const modules = fs.readdirSync(modulesDir);

      for (const module of modules) {
        const moduleDir = path.join(modulesDir, module);
        if (fs.statSync(moduleDir).isDirectory()) {
          // Look for router files
          const routerFiles = fs
            .readdirSync(moduleDir)
            .filter(file => file.includes('router') && file.endsWith('.js'));

          if (routerFiles.length > 0) {
            const routerPath = path.join(moduleDir, routerFiles[0]);
            const routes = extractRoutes(routerPath);
            if (routes.length > 0) {
              moduleRoutes[module] = routes;
            }
          }
        }
      }
    }

    // Get vercel.json routes if available
    let vercelRoutes = [];
    const vercelConfigPath = path.join(projectRoot, 'vercel.json');

    if (fs.existsSync(vercelConfigPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
        if (vercelConfig.routes && Array.isArray(vercelConfig.routes)) {
          vercelRoutes = vercelConfig.routes.map(route => ({
            src: route.src,
            dest: route.dest
          }));
        }
      } catch (error) {
        console.error('Error parsing vercel.json:', error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'API routes retrieved successfully',
      data: {
        mainRoutes,
        moduleRoutes,
        vercelRoutes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving API routes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving API routes',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server if not in serverless environment
if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  const startServer = (portToUse, attempts = 0) => {
    try {
      server = http.createServer(app);

      // Initialize Socket.IO
      io = initializeSocketIO(server);

      // Initialize scheduled jobs
      scheduledJobs = initScheduledJobs();

      server.listen(portToUse, () => {
        console.log(`✅ Server running on port ${portToUse}`);
        console.log(`📚 API Documentation: http://localhost:${portToUse}/api-docs`);
      });

      // Handle server errors
      server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${portToUse} is in use, trying port ${portToUse + 1}`);

          // Try the next port if we haven't exceeded max attempts
          if (attempts < MAX_PORT_ATTEMPTS) {
            server.close();
            startServer(portToUse + 1, attempts + 1);
          } else {
            console.error(
              `❌ Failed to find an available port after ${MAX_PORT_ATTEMPTS} attempts`
            );
            process.exit(1);
          }
        } else {
          console.error('❌ Server error:', err);
          process.exit(1);
        }
      });
    } catch (err) {
      console.error('❌ Error starting server:', err);
      process.exit(1);
    }
  };

  // Graceful shutdown handler
  const gracefulShutdown = async signal => {
    console.log(`\n🛑 ${signal} signal received: closing HTTP server and database connections`);

    // Close server first to stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }

    // Close Socket.IO connections
    if (io) {
      io.close(() => {
        console.log('✅ Socket.IO server closed');
      });
    }

    // Stop scheduled jobs
    if (scheduledJobs) {
      stopScheduledJobs(scheduledJobs);
      console.log('✅ Scheduled jobs stopped');
    }

    // Close Redis connection
    try {
      await shutdownRedis();
      console.log('✅ Redis connection closed');
    } catch (err) {
      console.error('❌ Error closing Redis:', err);
    }

    // Close database connections
    try {
      await closeDatabase();
      console.log('✅ Database connections closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing database:', err);
      process.exit(1);
    }
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start the server
  startServer(port);
} else {
  console.log('🚀 Running in serverless mode');
}

// Export the Express API for Vercel Serverless Functions
export default app;
