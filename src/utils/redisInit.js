import { redis, testRedisConnection, closeRedisConnection } from './redis.js';
import { logger } from './logger.js';

/**
 * Initialize Redis connection and test connectivity
 */
export const initializeRedis = async () => {
  try {
    logger.info('🔄 Initializing Redis connection...');
    
    // Test Redis connection
    const isConnected = await testRedisConnection();
    
    if (isConnected) {
      logger.info('✅ Redis initialized successfully');
      return true;
    } else {
      logger.warn('⚠️ Redis connection failed, continuing without cache');
      return false;
    }
  } catch (error) {
    logger.error('❌ Redis initialization error:', error.message);
    logger.warn('⚠️ Continuing without Redis cache');
    return false;
  }
};

/**
 * Graceful Redis shutdown
 */
export const shutdownRedis = async () => {
  try {
    await closeRedisConnection();
    logger.info('✅ Redis connection closed gracefully');
  } catch (error) {
    logger.error('❌ Error during Redis shutdown:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('🔄 Received SIGINT, shutting down Redis...');
  await shutdownRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🔄 Received SIGTERM, shutting down Redis...');
  await shutdownRedis();
  process.exit(0);
});

export default {
  initializeRedis,
  shutdownRedis
};
