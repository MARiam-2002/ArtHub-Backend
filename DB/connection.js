import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

// Variables for connection management
let mongoServer;
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000; // 3 seconds

// Global connection cache - critical for serverless
let cachedConnection = null;
let isConnecting = false;
let connectionPromise = null;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN = 1000; // 1 second between connection attempts

// Serverless-optimized connection options
const getConnectionOptions = (isServerless = false) => {
  const baseOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: isServerless ? 5 : 10,
    minPoolSize: isServerless ? 1 : 2,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Critical settings for preventing "buffering timed out" errors
    bufferCommands: false, // Disable buffering when not connected
    autoIndex: false, // Don't build indexes on connection
    family: 4, // Force IPv4
    // Heartbeat to keep connection alive
    heartbeatFrequencyMS: 10000
  };

  if (isServerless) {
    // Additional serverless optimizations
    baseOptions.serverSelectionTimeoutMS = 5000; // Faster server selection timeout
    baseOptions.connectTimeoutMS = 5000; // Faster connect timeout
    baseOptions.socketTimeoutMS = 30000; // Shorter socket timeout
    baseOptions.maxPoolSize = 1; // Smaller connection pool for serverless
    baseOptions.minPoolSize = 0; // No minimum pool size
    baseOptions.maxIdleTimeMS = 10000; // Close idle connections faster
    baseOptions.keepAlive = true; // Keep connections alive
    baseOptions.keepAliveInitialDelay = 30000; // 30 seconds
    
    // Only add directConnection for non-SRV URIs
    const connectionUrl = process.env.CONNECTION_URL || '';
    if (!connectionUrl.includes('+srv')) {
      baseOptions.directConnection = true; // Skip DNS seedlist discovery
    }
  }

  return baseOptions;
};

/**
 * Connect to MongoDB with optimized settings for serverless environments
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
export const connectDB = async (retryCount = 0) => {
  // Implement connection throttling to prevent connection storms
  const now = Date.now();
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
    console.log("⏱️ Connection attempt throttled, waiting for cooldown");
    await new Promise(resolve => setTimeout(resolve, CONNECTION_COOLDOWN));
  }
  lastConnectionAttempt = Date.now();
  
  // If already connecting, return the existing promise to prevent multiple connection attempts
  if (isConnecting && connectionPromise) {
    console.log("🔄 Already attempting to connect, reusing connection promise");
    return connectionPromise;
  }
  
  // If we already have a valid connection, return it immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    try {
      // Verify connection with a quick ping
      await mongoose.connection.db.admin().ping();
      console.log("✅ Using cached MongoDB connection");
      return cachedConnection;
    } catch (pingError) {
      console.log("⚠️ Cached connection failed ping check, will reconnect");
      // Connection is stale, continue to reconnect
      cachedConnection = null;
    }
  }

  // Set connecting flag and create a new connection promise
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        try {
          // Verify with ping
          await mongoose.connection.db.admin().ping();
          console.log("✅ Mongoose already connected");
          cachedConnection = mongoose.connection;
          return mongoose.connection;
        } catch (pingError) {
          console.log("⚠️ Existing connection failed ping check, will reconnect");
          // Force close the stale connection
          try {
            await mongoose.connection.close();
          } catch (closeError) {
            console.error("⚠️ Error closing stale connection:", closeError.message);
          }
        }
      }
      
      // Different connection approach based on environment
      if (process.env.NODE_ENV === "production") {
        // Production environment: use CONNECTION_URL from environment variables
        if (!process.env.CONNECTION_URL) {
          console.error("❌ Missing CONNECTION_URL environment variable in production");
          throw new Error("Missing CONNECTION_URL in production");
        }

        // Check if connection string contains placeholders
        if (process.env.CONNECTION_URL.includes('your_username') || 
            process.env.CONNECTION_URL.includes('your_password') || 
            process.env.CONNECTION_URL.includes('your_cluster')) {
          console.error("⚠️ MongoDB connection string contains placeholder values");
          throw new Error("MongoDB connection string contains placeholders");
        }

        console.log("🔄 Connecting to production MongoDB...");
        
        // Detect serverless environment
        const isServerless = !!process.env.VERCEL || !!process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME;
        if (isServerless) {
          console.log("🚀 Running in serverless environment, using optimized settings");
        }
        
        // Get appropriate connection options
        const options = getConnectionOptions(isServerless);
        
        // Connect with optimized settings and exponential backoff
        let lastError = null;
        let backoffTime = RETRY_INTERVAL;
        
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`🔄 Connection attempt ${attempt} of ${MAX_RETRIES}...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              backoffTime = backoffTime * 1.5; // Exponential backoff
            }
            
            // For Vercel, add a special flag to help with debugging
            if (isServerless) {
              console.log(`🔄 Connecting to MongoDB with URL pattern: ${process.env.CONNECTION_URL.split('@')[1].split('/')[0]}`);
            }
            
            await mongoose.connect(process.env.CONNECTION_URL, options);
            break; // Connection successful, exit the loop
          } catch (err) {
            lastError = err;
            console.error(`❌ Connection attempt ${attempt + 1} failed:`, err.message);
            
            // If this was the last attempt, throw the error
            if (attempt === MAX_RETRIES) {
              throw err;
            }
          }
        }
      } else {
        // Development environment: use in-memory MongoDB if no CONNECTION_URL
        if (!process.env.CONNECTION_URL) {
          console.log("🧪 No CONNECTION_URL provided, using in-memory MongoDB instance");
          
          // Create in-memory database if not exists
          if (!mongoServer) {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            console.log(`🧪 In-memory MongoDB server started at ${mongoUri}`);
            process.env.CONNECTION_URL = mongoUri;
          }
          
          // Connect to in-memory database with appropriate options
          await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
        } else {
          // Try to connect with the provided URL
          try {
            console.log("🔄 Connecting to development MongoDB with provided URL...");
            await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
          } catch (connectionError) {
            // If connection fails, fall back to in-memory database
            console.log("⚠️ Connection to provided MongoDB URL failed, falling back to in-memory database");
            
            if (!mongoServer) {
              mongoServer = await MongoMemoryServer.create();
              const mongoUri = mongoServer.getUri();
              console.log(`🧪 In-memory MongoDB server started at ${mongoUri}`);
              process.env.CONNECTION_URL = mongoUri;
            }
            
            // Connect to in-memory database
            await mongoose.connect(process.env.CONNECTION_URL, getConnectionOptions(false));
          }
        }
      }

      console.log("✅ MongoDB connected successfully!");
      
      // Set up connection event listeners for better error handling
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        // Reset cache if connection fails after initial success
        if (cachedConnection) {
          cachedConnection = null;
        }
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        // Reset cache on disconnect
        cachedConnection = null;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        // Update cache on reconnect
        cachedConnection = mongoose.connection;
      });
      
      // Cache the connection
      cachedConnection = mongoose.connection;
      return cachedConnection;
    } catch (error) {
      console.error("❌ Database connection error:", error.message);
      
      // Enhanced error messaging based on error type
      if (error.name === 'MongoServerSelectionError') {
        console.error("⚠️ Could not connect to MongoDB server. Please check:");
        console.error("  - MongoDB server is running and accessible");
        console.error("  - Connection URL is correct (username, password, cluster name)");
        console.error("  - Network allows connection to MongoDB (firewall/security groups)");
        console.error("  - MongoDB Atlas IP whitelist includes your server's IP (add 0.0.0.0/0 for testing)");
        
        // Check if this is a Vercel deployment
        if (process.env.VERCEL || process.env.VERCEL_ENV) {
          console.error("⚠️ IMPORTANT: For Vercel deployments, you MUST add 0.0.0.0/0 to your MongoDB Atlas IP whitelist");
          console.error("  - Vercel uses dynamic IPs for serverless functions");
          console.error("  - Go to MongoDB Atlas > Network Access and add 0.0.0.0/0");
        }
      } else if (error.name === 'MongoParseError') {
        console.error("⚠️ Invalid MongoDB connection string format");
      } else if (error.message.includes('Authentication failed')) {
        console.error("⚠️ MongoDB authentication failed. Check username and password");
      } else if (error.message.includes('ENOTFOUND')) {
        console.error("⚠️ Could not resolve MongoDB host. Check cluster address");
      } else if (error.message.includes('buffering timed out')) {
        console.error("⚠️ MongoDB operation buffering timed out. This typically happens when:");
        console.error("  - The connection to MongoDB is unstable or has high latency");
        console.error("  - The MongoDB server is under heavy load");
        console.error("  - The IP whitelist in MongoDB Atlas doesn't include your server's IP");
        
        if (process.env.VERCEL || process.env.VERCEL_ENV) {
          console.error("⚠️ For Vercel deployments, this is often caused by IP whitelist restrictions");
          console.error("  - Add 0.0.0.0/0 to your MongoDB Atlas IP whitelist");
        }
      }
      
      // Implement retry mechanism with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const backoffTime = RETRY_INTERVAL * Math.pow(1.5, retryCount);
        console.log(`🔄 Retrying connection in ${backoffTime/1000} seconds... (Attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        // Reset flags for retry
        isConnecting = false;
        connectionPromise = null;
        
        // Try again with incremented retry count
        return connectDB(retryCount + 1);
      }
      
      // After all retries, handle based on environment
      if (process.env.NODE_ENV === "production") {
        // In production, reject with error
        throw error;
      } else {
        // In development, provide more detailed error information
        console.error("💡 Check if your MongoDB connection string is correct or use in-memory database");
        throw error;
      }
    } finally {
      // Reset connecting flag
      isConnecting = false;
      connectionPromise = null;
    }
  })();
  
  return connectionPromise;
};

/**
 * Check if database connection is alive and reconnect if needed
 * @returns {Promise<boolean>} Connection status
 */
export const checkDatabaseConnection = async () => {
  try {
    // If no connection exists, try to connect
    if (!cachedConnection || mongoose.connection.readyState !== 1) {
      console.log("🔄 No active connection, attempting to connect...");
      await connectDB();
      return mongoose.connection.readyState === 1;
    }
    
    // Verify connection with a simple ping with timeout
    try {
      // Use a promise with timeout for the ping
      const pingPromise = mongoose.connection.db.admin().ping();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Ping timeout')), 2000);
      });
      
      // Race the ping against the timeout
      await Promise.race([pingPromise, timeoutPromise]);
      return true;
    } catch (pingError) {
      console.error("❌ Database ping failed:", pingError.message);
      
      // If ping fails, the connection might be stale
      console.log("🔄 Ping failed, attempting to reconnect...");
      
      // Close the existing connection first
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        console.error("⚠️ Error closing stale connection:", closeError.message);
      }
      
      // Reset cache
      cachedConnection = null;
      
      // Try to reconnect
      await connectDB();
      
      // Verify the new connection
      return mongoose.connection.readyState === 1;
    }
  } catch (error) {
    console.error("❌ Database connection check failed:", error.message);
    
    // Reset cache on failed check
    cachedConnection = null;
    
    // Try to reconnect once with a fresh connection
    try {
      // Force a fresh connection
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      
      await connectDB();
      return mongoose.connection.readyState === 1;
    } catch (reconnectError) {
      console.error("❌ Database reconnection failed:", reconnectError.message);
      return false;
    }
  }
};

/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
export const closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) { // Check if connection is active
      if (mongoServer) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        mongoServer = null;
        console.log("✅ In-memory MongoDB server stopped successfully");
      } else {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed successfully");
      }
      cachedConnection = null;
    }
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
    throw error;
  }
};
