/**
 * MongoDB utilities for optimizing database operations
 * Especially useful in serverless environments
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../../DB/connection.js';

dotenv.config();

/**
 * Maximum number of connection retry attempts
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff (in ms)
 */
const BASE_RETRY_DELAY = 1000;

/**
 * Optimized MongoDB connection options for serverless environments
 */
const SERVERLESS_CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 5000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 45000,
  waitQueueTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  directConnection: false,
  retryWrites: true,
  retryReads: true,
  autoIndex: false, // Don't build indexes in production
  bufferCommands: false // Disable command buffering in serverless
};

/**
 * Development environment MongoDB connection options
 */
const DEV_CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  keepAlive: true,
  keepAliveInitialDelay: 300000,
  retryWrites: true,
  retryReads: true,
  autoIndex: true, // Build indexes in development
  bufferCommands: true // Enable command buffering in development
};

/**
 * Get the appropriate MongoDB connection options based on environment
 * @returns {Object} MongoDB connection options
 */
export const getConnectionOptions = () => {
  // Use serverless optimized options in production
  if (process.env.NODE_ENV === 'production' || 
      process.env.VERCEL || 
      process.env.VERCEL_ENV) {
    return SERVERLESS_CONNECTION_OPTIONS;
  }
  
  // Use development options otherwise
  return DEV_CONNECTION_OPTIONS;
};

/**
 * Check if a collection exists and is accessible
 * @param {string} collectionName - Name of the collection to check
 * @returns {Promise<boolean>} - Whether the collection exists and is accessible
 */
export const checkCollectionHealth = async (collectionName) => {
  try {
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Check if our collection exists
    const exists = collections.some(col => col.name === collectionName);
    
    if (!exists) {
      console.warn(`⚠️ Collection "${collectionName}" does not exist`);
      return false;
    }
    
    // Try a simple stats query to verify access
    const stats = await mongoose.connection.db.collection(collectionName).stats();
    return stats && stats.ok === 1;
  } catch (error) {
    console.error(`❌ Error checking collection "${collectionName}":`, error);
    return false;
  }
};

/**
 * Check if an index exists on a collection
 * @param {string} collectionName - Name of the collection
 * @param {string} indexName - Name of the index to check
 * @returns {Promise<boolean>} - Whether the index exists
 */
export const checkIndex = async (collectionName, indexName) => {
  try {
    const indexes = await mongoose.connection.db
      .collection(collectionName)
      .indexes();
    
    return indexes.some(index => index.name === indexName);
  } catch (error) {
    console.error(`❌ Error checking index "${indexName}":`, error);
    return false;
  }
};

/**
 * Create a lean query with projection for better performance
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Array|Object} projection - Fields to include/exclude
 * @returns {mongoose.Query} - Optimized query
 */
export const createOptimizedQuery = (model, filter, projection = {}) => {
  return model.find(filter, projection).lean();
};

/**
 * Perform a paginated query with optimized settings
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} options - Query options (sort, projection, etc.)
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>} - Paginated results with metadata
 */
export const paginatedQuery = async (model, filter = {}, options = {}, page = 1, limit = 10) => {
  const { sort = {}, projection = {} } = options;
  
  // Calculate skip value
  const skip = (page - 1) * limit;
  
  // Set reasonable timeout for serverless environment
  const maxTimeMS = 5000;
  
  try {
    // Execute query with timeout and pagination
    const query = model.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .maxTimeMS(maxTimeMS);
    
    // Get total count with the same filter but without pagination
    const countQuery = model.countDocuments(filter).maxTimeMS(maxTimeMS);
    
    // Execute both queries in parallel
    const [results, total] = await Promise.all([query, countQuery]);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    };
  } catch (error) {
    // Handle timeout errors specifically
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      throw new Error('Database query timed out. Please try again or refine your search.');
    }
    throw error;
  }
};

/**
 * Connect to MongoDB with retry logic
 * @param {boolean} forceReconnect - Force a new connection even if one exists
 * @returns {Promise<boolean>} True if connected successfully
 */
export const ensureDatabaseConnection = async (forceReconnect = false) => {
  // If already connected and not forcing reconnect, return true
  if (mongoose.connection.readyState === 1 && !forceReconnect) {
    try {
      // Quick ping to verify connection is actually working
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (pingError) {
      console.warn("Connection ping failed, will attempt reconnection:", pingError.message);
      // Continue with reconnection
    }
  }
  
  // If connection is in progress and not forcing reconnect, wait for it
  if (mongoose.connection.readyState === 2 && !forceReconnect) {
    try {
      await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (mongoose.connection.readyState !== 2) {
            clearInterval(checkInterval);
            reject(new Error('Connection failed'));
          }
        }, 100);
        
        // Timeout after 10 seconds (increased from 5)
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Connection timeout'));
        }, 10000);
      });
      return true;
    } catch (error) {
      console.error('Error waiting for connection:', error);
    }
  }
  
  // Close existing connection if forcing reconnect
  if (forceReconnect && mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('Error closing existing connection:', closeError);
    }
  }
  
  // Get connection options based on environment
  const connectionOptions = getConnectionOptions();
  
  // Use environment variables for max retry attempts and base delay
  const MAX_RETRY_ATTEMPTS = parseInt(process.env.MONGODB_MAX_RETRY_ATTEMPTS || '5');
  const BASE_RETRY_DELAY = parseInt(process.env.MONGODB_BASE_RETRY_DELAY || '1000');
  
  // Try to connect with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // Calculate delay with exponential backoff
      if (attempt > 0) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} after ${delay}ms delay`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Log connection attempt with redacted URL
      if (process.env.CONNECTION_URL) {
        try {
          const url = new URL(process.env.CONNECTION_URL);
          console.log(`Connecting to MongoDB at ${url.protocol}//${url.hostname}:${url.port || 'default'}${url.pathname}`);
        } catch (urlError) {
          console.log("Connecting to MongoDB with CONNECTION_URL");
        }
      }
      
      // Connect to MongoDB
      await mongoose.connect(process.env.CONNECTION_URL, connectionOptions);
      
      // Verify connection with ping
      await mongoose.connection.db.admin().ping();
      
      console.log(`✅ MongoDB connected successfully on attempt ${attempt + 1}`);
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt + 1} failed:`, error.message);
      
      // Log more detailed error information
      if (error.name === 'MongoServerSelectionError') {
        console.error("Server selection timed out. Check network connectivity and MongoDB Atlas status.");
      } else if (error.name === 'MongoNetworkError') {
        console.error("Network error connecting to MongoDB. Check firewall settings and network connectivity.");
      }
      
      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRY_ATTEMPTS - 1) {
        console.error('All connection attempts failed');
        return false;
      }
    }
  }
  
  return false;
};

/**
 * Check if the database connection is healthy
 * @returns {Promise<boolean>} True if the connection is healthy
 */
export const checkDatabaseConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Try to ping the database
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

/**
 * Get detailed information about the database health
 * @returns {Promise<Object>} Database health information
 */
export const checkDatabaseHealth = async () => {
  const result = {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    status: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
  };
  
  if (result.isConnected) {
    try {
      // Get server status
      const adminDb = mongoose.connection.db.admin();
      const serverStatus = await adminDb.serverStatus();
      const pingResult = await adminDb.ping();
      
      result.details = {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections?.current || 0,
        ok: serverStatus.ok === 1,
        ping: pingResult.ok === 1
      };
      
      // Get connection pool stats
      result.connectionPool = {
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        options: mongoose.connection.options
      };
    } catch (error) {
      result.error = {
        message: error.message,
        name: error.name
      };
    }
  }
  
  return result;
};

/**
 * Optimize MongoDB for serverless environments
 * This should be called during application initialization
 */
export const optimizeForServerless = () => {
  // Set global mongoose options
  mongoose.set('strictQuery', true);
  
  // Add connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });
  
  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
  
  // Return the connection options being used
  return getConnectionOptions();
};

/**
 * Create a MongoDB index with error handling
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} indexSpec - Index specification
 * @param {Object} options - Index options
 * @returns {Promise<boolean>} True if index was created successfully
 */
export const createIndex = async (model, indexSpec, options = {}) => {
  try {
    await model.collection.createIndex(indexSpec, options);
    return true;
  } catch (error) {
    console.error(`Error creating index on ${model.modelName}:`, error);
    return false;
  }
};

/**
 * Safely execute a MongoDB operation with timeout and retry
 * @param {Function} operation - The MongoDB operation to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {number} retries - Number of retries
 * @returns {Promise<any>} The operation result
 */
export const safeDbOperation = async (operation, timeoutMs = 5000, retries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Execute operation with timeout
      return await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
        )
      ]);
    } catch (error) {
      lastError = error;
      console.error(`Operation failed (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      
      // Check if we should retry
      if (attempt < retries) {
        // Check if we need to reconnect
        if (mongoose.connection.readyState !== 1) {
          try {
            await ensureDatabaseConnection(true);
          } catch (reconnectError) {
            console.error('Failed to reconnect:', reconnectError);
          }
        }
        
        // Wait before retrying
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All attempts failed
  throw lastError;
};

export default {
  checkCollectionHealth,
  checkIndex,
  createOptimizedQuery,
  paginatedQuery,
  checkDatabaseConnection,
  checkDatabaseHealth,
  ensureDatabaseConnection,
  optimizeForServerless,
  createIndex,
  safeDbOperation,
  getConnectionOptions
}; 