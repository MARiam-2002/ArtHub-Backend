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

/**
 * Connect to MongoDB with optimized settings for serverless environments
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
export const connectDB = async (retryCount = 0) => {
  // If already connecting, return the existing promise to prevent multiple connection attempts
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }
  
  // If we already have a valid connection, return it immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("✅ Using cached MongoDB connection");
    return cachedConnection;
  }

  // Set connecting flag and create a new connection promise
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      // Check if mongoose is already connected
      if (mongoose.connection.readyState === 1) {
        console.log("✅ Mongoose already connected");
        cachedConnection = mongoose.connection;
        return mongoose.connection;
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
        
        // Highly optimized options for Vercel serverless environment
        const options = {
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          connectTimeoutMS: 10000,
          maxPoolSize: 5,
          minPoolSize: 1,
          bufferCommands: true,
          bufferTimeoutMS: 30000,
          useNewUrlParser: true,
          useUnifiedTopology: true,
          // Auto reconnect settings
          autoReconnect: true,
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 1000,
          // Heartbeat to keep connection alive
          heartbeatFrequencyMS: 10000,
          // Serverless optimizations
          poolSize: 5,
          family: 4 // Force IPv4
        };
        
        // Special handling for Vercel environment
        if (process.env.VERCEL || process.env.VERCEL_ENV) {
          console.log("🚀 Running in Vercel environment, using serverless optimizations");
          options.directConnection = true;
        }
        
        // Connect with optimized settings
        await mongoose.connect(process.env.CONNECTION_URL, options);
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
          
          // Connect to in-memory database
          await mongoose.connect(process.env.CONNECTION_URL, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            bufferCommands: true,
            bufferTimeoutMS: 30000,
          });
        } else {
          // Use CONNECTION_URL from environment variables for development
          console.log("🔄 Connecting to development MongoDB with provided URL...");
          await mongoose.connect(process.env.CONNECTION_URL, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            bufferCommands: true,
            bufferTimeoutMS: 30000,
          });
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
        console.error("  - MongoDB Atlas IP whitelist includes your server's IP");
      } else if (error.name === 'MongoParseError') {
        console.error("⚠️ Invalid MongoDB connection string format");
      } else if (error.message.includes('Authentication failed')) {
        console.error("⚠️ MongoDB authentication failed. Check username and password");
      } else if (error.message.includes('ENOTFOUND')) {
        console.error("⚠️ Could not resolve MongoDB host. Check cluster address");
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
    // If no connection or disconnected, try to connect
    if (!cachedConnection || mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    
    // Verify connection with a simple ping
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error("❌ Database connection check failed:", error.message);
    
    // Reset cache on failed check
    cachedConnection = null;
    
    // Try to reconnect once
    try {
      await connectDB();
      return true;
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
