import { redis } from './redis.js';
import { logger } from './logger.js';

/**
 * Cache configuration - Optimized for performance
 */
const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes
  LONG_TTL: 3600,   // 1 hour - Increased for home data
  SHORT_TTL: 60,    // 1 minute
  VERY_LONG_TTL: 7200, // 2 hours - Increased for categories
  CACHE_PREFIX: 'arthub:',
  SEPARATOR: ':'
};

/**
 * Generate cache key with prefix
 * @param {string} key - Base cache key
 * @param {string} prefix - Optional prefix
 * @returns {string} - Formatted cache key
 */
export const generateCacheKey = (key, prefix = '') => {
  const parts = [CACHE_CONFIG.CACHE_PREFIX];
  if (prefix) parts.push(prefix);
  parts.push(key);
  return parts.join(CACHE_CONFIG.SEPARATOR);
};

/**
 * Set cache with TTL - Optimized for performance
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const setCache = async (key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    const cacheKey = generateCacheKey(key);
    const serializedValue = JSON.stringify(value);
    
    await redis.setex(cacheKey, ttl, serializedValue);
    logger.debug(`✅ Cache set: ${cacheKey} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    logger.error(`❌ Cache set error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Get cache value - Optimized for performance
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached value or null
 */
export const getCache = async (key) => {
  try {
    const cacheKey = generateCacheKey(key);
    const cachedValue = await redis.get(cacheKey);
    
    if (cachedValue) {
      logger.debug(`✅ Cache hit: ${cacheKey}`);
      return JSON.parse(cachedValue);
    }
    
    logger.debug(`❌ Cache miss: ${cacheKey}`);
    return null;
  } catch (error) {
    logger.error(`❌ Cache get error for key ${key}:`, error.message);
    return null;
  }
};

/**
 * Delete cache entry - Optimized for performance
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCache = async (key) => {
  try {
    const cacheKey = generateCacheKey(key);
    const result = await redis.del(cacheKey);
    logger.debug(`🗑️ Cache deleted: ${cacheKey}`);
    return result > 0;
  } catch (error) {
    logger.error(`❌ Cache delete error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Delete multiple cache entries by pattern - Optimized for performance
 * @param {string} pattern - Cache key pattern
 * @returns {Promise<number>} - Number of deleted keys
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    const cachePattern = generateCacheKey(pattern);
    const keys = await redis.keys(cachePattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    const result = await redis.del(...keys);
    logger.debug(`🗑️ Cache pattern deleted: ${cachePattern} (${result} keys)`);
    return result;
  } catch (error) {
    logger.error(`❌ Cache pattern delete error for pattern ${pattern}:`, error.message);
    return 0;
  }
};

/**
 * Check if cache key exists - Optimized for performance
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Exists status
 */
export const cacheExists = async (key) => {
  try {
    const cacheKey = generateCacheKey(key);
    const exists = await redis.exists(cacheKey);
    return exists === 1;
  } catch (error) {
    logger.error(`❌ Cache exists check error for key ${key}:`, error.message);
    return false;
  }
};

/**
 * Get cache TTL - Optimized for performance
 * @param {string} key - Cache key
 * @returns {Promise<number>} - TTL in seconds (-1 if no expiry, -2 if key doesn't exist)
 */
export const getCacheTTL = async (key) => {
  try {
    const cacheKey = generateCacheKey(key);
    return await redis.ttl(cacheKey);
  } catch (error) {
    logger.error(`❌ Cache TTL check error for key ${key}:`, error.message);
    return -2;
  }
};

/**
 * Increment cache value (for counters) - Optimized for performance
 * @param {string} key - Cache key
 * @param {number} increment - Increment value (default: 1)
 * @param {number} ttl - TTL for new keys
 * @returns {Promise<number>} - New value
 */
export const incrementCache = async (key, increment = 1, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    const cacheKey = generateCacheKey(key);
    const newValue = await redis.incrby(cacheKey, increment);
    
    // Set TTL if this is a new key
    if (newValue === increment) {
      await redis.expire(cacheKey, ttl);
    }
    
    return newValue;
  } catch (error) {
    logger.error(`❌ Cache increment error for key ${key}:`, error.message);
    return 0;
  }
};

/**
 * Cache with fallback function - Ultra optimized for performance
 * @param {string} key - Cache key
 * @param {Function} fallbackFn - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} - Cached or fresh value
 */
export const cacheWithFallback = async (key, fallbackFn, ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  try {
    // Try to get from cache first - optimized for speed
    const cachedValue = await getCache(key);
    if (cachedValue !== null) {
      logger.debug(`✅ Cache hit for key: ${key}`);
      return cachedValue;
    }
    
    // Cache miss - execute fallback function
    logger.debug(`🔄 Cache miss, executing fallback for key: ${key}`);
    const freshValue = await fallbackFn();
    
    // Cache the fresh value asynchronously for ultra performance - don't wait for cache write
    if (freshValue !== null && freshValue !== undefined) {
      setCache(key, freshValue, ttl).catch(err => 
        logger.error(`❌ Async cache set error for key ${key}:`, err.message)
      );
    }
    
    return freshValue;
  } catch (error) {
    logger.error(`❌ Cache with fallback error for key ${key}:`, error.message);
    // If caching fails, still try to return fresh data
    try {
      return await fallbackFn();
    } catch (fallbackError) {
      logger.error(`❌ Fallback function error for key ${key}:`, fallbackError.message);
      throw fallbackError;
    }
  }
};

/**
 * Cache middleware for Express routes - Optimized for performance
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in seconds
 * @param {string} options.keyGenerator - Function to generate cache key from request
 * @param {boolean} options.skipCache - Function to determine if cache should be skipped
 * @returns {Function} - Express middleware
 */
export const cacheMiddleware = (options = {}) => {
  const {
    ttl = CACHE_CONFIG.DEFAULT_TTL,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`,
    skipCache = () => false
  } = options;

  return async (req, res, next) => {
    try {
      // Skip cache if condition is met
      if (skipCache(req)) {
        return next();
      }

      const cacheKey = keyGenerator(req);
      const cachedResponse = await getCache(cacheKey);

      if (cachedResponse) {
        logger.debug(`✅ Cache hit for route: ${req.originalUrl}`);
        return res.json(cachedResponse);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Cache the response
        if (data && data.success !== false) {
          setCache(cacheKey, data, ttl).catch(error => {
            logger.error(`❌ Error caching response for ${req.originalUrl}:`, error.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error(`❌ Cache middleware error for ${req.originalUrl}:`, error.message);
      next();
    }
  };
};

/**
 * Invalidate cache by pattern (useful for related data) - Optimized for performance
 * @param {string} pattern - Cache key pattern
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateCache = async (pattern) => {
  return await deleteCacheByPattern(pattern);
};

/**
 * Cache statistics - Optimized for performance
 * @returns {Promise<Object>} - Cache statistics
 */
export const getCacheStats = async () => {
  try {
    const info = await redis.info('memory');
    const keyspace = await redis.info('keyspace');
    
    return {
      memory: info,
      keyspace: keyspace,
      connected: redis.status === 'ready'
    };
  } catch (error) {
    logger.error('❌ Error getting cache stats:', error.message);
    return { error: error.message };
  }
};

/**
 * Clear all cache (use with caution) - Optimized for performance
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllCache = async () => {
  try {
    const pattern = generateCacheKey('*');
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) {
      return true;
    }
    
    await redis.del(...keys);
    logger.info(`🗑️ Cleared all cache (${keys.length} keys)`);
    return true;
  } catch (error) {
    logger.error('❌ Error clearing all cache:', error.message);
    return false;
  }
};

// Export cache configuration
export { CACHE_CONFIG };

// Export default cache utilities - Ultra optimized for performance
export default {
  setCache,
  getCache,
  deleteCache,
  deleteCacheByPattern,
  cacheExists,
  getCacheTTL,
  incrementCache,
  cacheWithFallback,
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  clearAllCache,
  generateCacheKey,
  CACHE_CONFIG
};
