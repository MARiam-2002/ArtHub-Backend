export function getPaginationParams(query, defaultLimit = 10) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, parseInt(query.limit) || defaultLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
} 