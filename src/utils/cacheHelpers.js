import { cacheWithFallback, generateCacheKey, CACHE_CONFIG } from './cache.js';
import { logger } from './logger.js';

/**
 * Cache helper functions for specific use cases
 */

/**
 * Cache user profile data
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch user data
 * @returns {Promise<any>} - User profile data
 */
export const cacheUserProfile = async (userId, fetchFn) => {
  const cacheKey = `user:profile:${userId}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.LONG_TTL);
};

/**
 * Cache artist profile with statistics
 * @param {string} artistId - Artist ID
 * @param {Function} fetchFn - Function to fetch artist data
 * @returns {Promise<any>} - Artist profile data
 */
export const cacheArtistProfile = async (artistId, fetchFn) => {
  const cacheKey = `artist:profile:${artistId}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.LONG_TTL);
};

/**
 * Cache artwork data
 * @param {string} artworkId - Artwork ID
 * @param {Function} fetchFn - Function to fetch artwork data
 * @returns {Promise<any>} - Artwork data
 */
export const cacheArtwork = async (artworkId, fetchFn) => {
  const cacheKey = `artwork:${artworkId}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache artwork details with reviews and related data
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Function to fetch artwork details
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Artwork details data
 */
export const cacheArtworkDetails = async (cacheKey, fetchFn, options = {}) => {
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache categories list
 * @param {Function} fetchFn - Function to fetch categories
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Categories data
 */
export const cacheCategories = async (fetchFn, options = {}) => {
  const { limit = 8, includeStats = false } = options;
  const cacheKey = `categories:list:${limit}:${includeStats}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.VERY_LONG_TTL);
};

/**
 * Cache category artworks
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Function to fetch category artworks
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Category artworks data
 */
export const cacheCategoryArtworks = async (cacheKey, fetchFn, options = {}) => {
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache home screen data
 * @param {string} userId - User ID (for personalized data)
 * @param {Function} fetchFn - Function to fetch home data
 * @returns {Promise<any>} - Home screen data
 */
export const cacheHomeData = async (userId, fetchFn) => {
  const cacheKey = userId ? `home:data:user:${userId}` : 'home:data:guest';
  // Use longer TTL for home data as it's frequently accessed and expensive to compute
  // Guest data: 15 minutes, User data: 10 minutes (optimized for speed)
  const ttl = userId ? CACHE_CONFIG.LONG_TTL : CACHE_CONFIG.VERY_LONG_TTL;
  return await cacheWithFallback(cacheKey, fetchFn, ttl);
};

/**
 * Cache dashboard statistics
 * @param {string} adminId - Admin ID
 * @param {Function} fetchFn - Function to fetch dashboard data
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Dashboard data
 */
export const cacheDashboardStats = async (adminId, fetchFn, options = {}) => {
  const { period = 'monthly', year = new Date().getFullYear() } = options;
  const cacheKey = `dashboard:stats:${adminId}:${period}:${year}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache artist performance data
 * @param {Function} fetchFn - Function to fetch performance data
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Performance data
 */
export const cacheArtistPerformance = async (fetchFn, options = {}) => {
  const { limit = 3, year = new Date().getFullYear(), month } = options;
  const cacheKey = `artists:performance:${limit}:${year}:${month || 'all'}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache artwork lists (featured, trending, etc.)
 * @param {string} listType - Type of list (featured, trending, most-rated, etc.)
 * @param {Function} fetchFn - Function to fetch list data
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Artwork list data
 */
export const cacheArtworkList = async (listType, fetchFn, options = {}) => {
  const { page = 1, limit = 20, category, search } = options;
  const cacheKey = `artworks:${listType}:${page}:${limit}:${category || 'all'}:${search || 'none'}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache user's wishlist
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch wishlist
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Wishlist data
 */
export const cacheUserWishlist = async (userId, fetchFn, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const cacheKey = `user:wishlist:${userId}:${page}:${limit}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache user's artworks
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch user artworks
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - User artworks data
 */
export const cacheUserArtworks = async (userId, fetchFn, options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const cacheKey = `user:artworks:${userId}:${page}:${limit}:${status || 'all'}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache special requests
 * @param {string} userId - User ID
 * @param {string} requestType - Type of requests (my, artist)
 * @param {Function} fetchFn - Function to fetch requests
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Special requests data
 */
export const cacheSpecialRequests = async (userId, requestType, fetchFn, options = {}) => {
  const { page = 1, limit = 10, status, requestType: reqType, priority } = options;
  const cacheKey = `requests:${requestType}:${userId}:${page}:${limit}:${status || 'all'}:${reqType || 'all'}:${priority || 'all'}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.SHORT_TTL);
};

/**
 * Cache chat data
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch chat data
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Chat data
 */
export const cacheChatData = async (userId, fetchFn, options = {}) => {
  const { page = 1, limit = 20, search = '' } = options;
  const cacheKey = `chat:list:${userId}:${page}:${limit}:${search}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.SHORT_TTL);
};

/**
 * Cache chat messages
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch messages
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Messages data
 */
export const cacheChatMessages = async (chatId, userId, fetchFn, options = {}) => {
  const { page = 1, limit = 50 } = options;
  const cacheKey = `chat:messages:${chatId}:${userId}:${page}:${limit}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.SHORT_TTL);
};

/**
 * Cache notifications
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch notifications
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Notifications data
 */
export const cacheNotifications = async (userId, fetchFn, options = {}) => {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const cacheKey = `notifications:${userId}:${page}:${limit}:${unreadOnly}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.SHORT_TTL);
};

/**
 * Cache user favorites/wishlist
 * @param {string} userId - User ID
 * @param {Function} fetchFn - Function to fetch favorites
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Favorites data
 */
export const cacheUserFavorites = async (userId, fetchFn, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const cacheKey = `user:favorites:${userId}:${page}:${limit}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache search results
 * @param {string} query - Search query
 * @param {string} type - Search type (artworks, artists, etc.)
 * @param {Function} fetchFn - Function to fetch search results
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Search results
 */
export const cacheSearchResults = async (query, type, fetchFn, options = {}) => {
  const { page = 1, limit = 20, filters } = options;
  const filtersKey = filters ? JSON.stringify(filters) : 'none';
  const cacheKey = `search:${type}:${query}:${page}:${limit}:${filtersKey}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache aggregation results (for complex queries)
 * @param {string} aggregationType - Type of aggregation
 * @param {Function} fetchFn - Function to fetch aggregation results
 * @param {Object} options - Cache options
 * @returns {Promise<any>} - Aggregation results
 */
export const cacheAggregation = async (aggregationType, fetchFn, options = {}) => {
  const optionsKey = JSON.stringify(options);
  const cacheKey = `aggregation:${aggregationType}:${Buffer.from(optionsKey).toString('base64')}`;
  return await cacheWithFallback(cacheKey, fetchFn, CACHE_CONFIG.DEFAULT_TTL);
};

/**
 * Cache invalidation helpers
 */

/**
 * Invalidate user-related cache
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateUserCache = async (userId) => {
  const patterns = [
    `user:profile:${userId}`,
    `user:wishlist:${userId}:*`,
    `user:artworks:${userId}:*`,
    `requests:my:${userId}:*`,
    `requests:artist:${userId}:*`,
    `chat:list:${userId}:*`,
    `chat:messages:*:${userId}:*`,
    `notifications:${userId}:*`
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for user ${userId}`);
  return totalInvalidated;
};

/**
 * Invalidate artwork-related cache
 * @param {string} artworkId - Artwork ID
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateArtworkCache = async (artworkId) => {
  const patterns = [
    `artwork:${artworkId}`,
    'artworks:featured:*',
    'artworks:trending:*',
    'artworks:most-rated:*',
    'home:data:*'
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for artwork ${artworkId}`);
  return totalInvalidated;
};

/**
 * Invalidate artist-related cache
 * @param {string} artistId - Artist ID
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateArtistCache = async (artistId) => {
  const patterns = [
    `artist:profile:${artistId}`,
    `user:artworks:${artistId}:*`,
    'artists:performance:*',
    'dashboard:stats:*'
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for artist ${artistId}`);
  return totalInvalidated;
};

/**
 * Invalidate category-related cache
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateCategoryCache = async () => {
  const patterns = [
    'categories:list:*',
    'artworks:*:*:*:*',
    'home:data:*'
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for categories`);
  return totalInvalidated;
};

/**
 * Invalidate dashboard cache
 * @param {string} adminId - Admin ID
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateDashboardCache = async (adminId) => {
  const patterns = [
    `dashboard:stats:${adminId}:*`,
    'artists:performance:*'
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for dashboard`);
  return totalInvalidated;
};

/**
 * Invalidate home cache
 * @returns {Promise<number>} - Number of invalidated keys
 */
export const invalidateHomeCache = async () => {
  const patterns = [
    'home:data:*',
    'artworks:featured:*',
    'artworks:trending:*',
    'artworks:most-rated:*',
    'search:*',
    'artist:profile:*',
    'category:artworks:*'
  ];
  
  let totalInvalidated = 0;
  for (const pattern of patterns) {
    const invalidated = await invalidateCache(pattern);
    totalInvalidated += invalidated;
  }
  
  logger.debug(`🗑️ Invalidated ${totalInvalidated} cache keys for home data`);
  return totalInvalidated;
};

/**
 * Preload home cache for better performance
 * @param {Function} fetchFn - Function to fetch home data
 * @returns {Promise<void>}
 */
export const preloadHomeCache = async (fetchFn) => {
  try {
    // Preload guest data
    const guestKey = 'home:data:guest';
    const guestData = await fetchFn();
    
    if (guestData) {
      await setCache(guestKey, guestData, CACHE_CONFIG.VERY_LONG_TTL);
      logger.debug(`🚀 Preloaded guest home cache`);
    }
  } catch (error) {
    logger.error('❌ Error preloading home cache:', error.message);
  }
};

// Import and re-export invalidateCache function
import { invalidateCache, setCache } from './cache.js';

// Re-export for named imports
export { invalidateCache };

export default {
  cacheUserProfile,
  cacheArtistProfile,
  cacheArtwork,
  cacheArtworkDetails,
  cacheCategories,
  cacheCategoryArtworks,
  cacheHomeData,
  preloadHomeCache,
  cacheDashboardStats,
  cacheArtistPerformance,
  cacheArtworkList,
  cacheUserWishlist,
  cacheUserArtworks,
  cacheSpecialRequests,
  cacheChatData,
  cacheChatMessages,
  cacheNotifications,
  cacheUserFavorites,
  cacheSearchResults,
  cacheAggregation,
  invalidateUserCache,
  invalidateArtworkCache,
  invalidateArtistCache,
  invalidateCategoryCache,
  invalidateDashboardCache,
  invalidateHomeCache,
  invalidateCache
};
