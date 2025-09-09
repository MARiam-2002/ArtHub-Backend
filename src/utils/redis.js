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

// Create Redis client instance
export const redis = new Redis(redisConfig);

// Redis connection event handlers
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

// Test Redis connection
export const testRedisConnection = async () => {
  try {
    await redis.ping();
    logger.info('✅ Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('❌ Redis connection test failed:', error.message);
    return false;
  }
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

export default redis;
