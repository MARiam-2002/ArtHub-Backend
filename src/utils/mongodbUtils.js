/**
 * MongoDB utilities for optimizing database operations
 * Especially useful in serverless environments
 */
import mongoose from 'mongoose';

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
 * Check database health with detailed diagnostics
 * @returns {Promise<Object>} - Health status and diagnostics
 */
export const checkDatabaseHealth = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'disconnected',
        readyState: mongoose.connection.readyState,
        healthy: false
      };
    }
    
    // Ping database
    const pingResult = await mongoose.connection.db.admin().ping();
    
    // Get server status if ping succeeds
    let serverStatus = null;
    if (pingResult.ok === 1) {
      try {
        serverStatus = await mongoose.connection.db.admin().serverStatus();
      } catch (statusError) {
        console.error('Error getting server status:', statusError);
      }
    }
    
    return {
      status: 'connected',
      healthy: pingResult.ok === 1,
      ping: pingResult,
      readyState: mongoose.connection.readyState,
      serverStatus: serverStatus ? {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections?.current || 0
      } : null
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'error',
      healthy: false,
      error: error.message,
      readyState: mongoose.connection.readyState
    };
  }
};

export default {
  checkCollectionHealth,
  checkIndex,
  createOptimizedQuery,
  paginatedQuery,
  checkDatabaseHealth
}; 