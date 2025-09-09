import Redis from 'ioredis';
import { logger } from './logger.js';

/**
 * Redis connection configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Parse Redis URL if provided
  ...(process.env.REDIS_URL && { url: process.env.REDIS_URL })
};

// In-memory cache fallback
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  async set(key, value, ttl = 300) {
    this.cache.set(key, value);
    
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    // Set new timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);
      this.timers.set(key, timer);
    }
    
    return 'OK';
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async del(key) {
    const deleted = this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return deleted ? 1 : 0;
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  async exists(key) {
    return this.cache.has(key) ? 1 : 0;
  }

  async ttl(key) {
    return this.cache.has(key) ? -1 : -2;
  }

  async incrby(key, increment) {
    const current = parseInt(this.cache.get(key) || '0');
    const newValue = current + increment;
    this.cache.set(key, newValue.toString());
    return newValue;
  }

  async expire(key, ttl) {
    if (!this.cache.has(key)) return 0;
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl * 1000);
    this.timers.set(key, timer);
    
    return 1;
  }

  async ping() {
    return 'PONG';
  }

  async quit() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
    return 'OK';
  }

  get status() {
    return 'ready';
  }
}

// Create Redis client instance with fallback
let redis;
let redisAvailable = false;

// Check if Redis URL is available and valid
if (process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379') {
  try {
    redis = new Redis(redisConfig);
    redisAvailable = true;
    logger.info('🔗 Redis URL found, attempting connection...');
  } catch (error) {
    logger.warn('⚠️ Redis connection failed, using in-memory cache fallback');
    redis = new InMemoryCache();
    redisAvailable = false;
  }
} else {
  logger.info('ℹ️ No valid Redis URL found, using in-memory cache');
  redis = new InMemoryCache();
  redisAvailable = false;
}

// Redis connection event handlers (only for real Redis)
if (redisAvailable) {
  redis.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  redis.on('ready', () => {
    logger.info('🚀 Redis is ready to accept commands');
  });

  redis.on('error', (error) => {
    logger.error('❌ Redis connection error:', error.message);
  });

  redis.on('close', () => {
    logger.warn('⚠️ Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('🔄 Redis reconnecting...');
  });
} else {
  logger.info('✅ In-memory cache initialized successfully');
}

// Test Redis connection
export const testRedisConnection = async () => {
  try {
    await redis.ping();
    if (redisAvailable) {
      logger.info('✅ Redis connection test successful');
    } else {
      logger.info('✅ In-memory cache test successful');
    }
    return true;
  } catch (error) {
    logger.error('❌ Cache connection test failed:', error.message);
    return false;
  }
};

// Check if Redis is available
export const isRedisAvailable = () => {
  return redisAvailable;
};

// Graceful shutdown
export const closeRedisConnection = async () => {
  try {
    await redis.quit();
    logger.info('✅ Redis connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error.message);
  }
};

// Export redis instance
export { redis };

export default redis;
