/**
 * Get standardized pagination parameters from query
 * @param {Object} query - Express query object
 * @param {number} defaultLimit - Default number of items per page
 * @param {number} maxLimit - Maximum allowed items per page
 * @returns {Object} Pagination parameters object
 */
export function getPaginationParams(query, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const requestedLimit = parseInt(query.limit) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;
  
  return { 
    page, 
    limit, 
    skip,
    getPaginationMetadata: (totalCount) => ({
      currentPage: page,
      itemsPerPage: limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    })
  };
} 