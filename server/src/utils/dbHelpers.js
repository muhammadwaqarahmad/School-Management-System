/**
 * DATABASE HELPERS
 * ================
 * Reusable database query utilities and helpers
 */

/**
 * Parse integer parameter from query/params
 * @param {string|number} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default value
 */
export const parseInteger = (value, defaultValue = null) => {
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse boolean parameter from query/params
 * @param {string|boolean} value - Value to parse
 * @param {boolean} defaultValue - Default value if parsing fails
 * @returns {boolean} Parsed boolean or default value
 */
export const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1';
  }
  return defaultValue;
};

/**
 * Build search OR condition for Prisma
 * @param {Array<string>} fields - Fields to search in
 * @param {string} searchQuery - Search query string
 * @returns {Array} Prisma OR condition array
 */
export const buildSearchCondition = (fields, searchQuery) => {
  if (!searchQuery || !fields || fields.length === 0) return null;
  
  return {
    OR: fields.map(field => ({
      [field]: { contains: searchQuery, mode: 'insensitive' }
    }))
  };
};

/**
 * Build pagination parameters
 * @param {Object} query - Query object with page and limit
 * @returns {Object} Pagination object with skip and take
 */
export const buildPagination = (query) => {
  const page = parseInteger(query.page, 1);
  const limit = parseInteger(query.limit, 10);
  const skip = (page - 1) * limit;
  
  return {
    skip: Math.max(0, skip),
    take: Math.max(1, Math.min(limit, 100)), // Max 100 items per page
    page,
    limit
  };
};

/**
 * Filter by status with fallback for backward compatibility
 * @param {Array} items - Items to filter
 * @param {string} status - Status to filter by
 * @param {Array<string>} allowedStatuses - Allowed status values
 * @returns {Array} Filtered items
 */
export const filterByStatus = (items, status, allowedStatuses = []) => {
  if (!status) {
    // Default: filter by ACTIVE or items without status
    return items.filter(item => !item.status || item.status === 'ACTIVE');
  }
  
  if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
    return items;
  }
  
  return items.filter(item => item.status === status);
};

/**
 * Add leaving date from status logs
 * @param {Object} item - Item with statusLogs
 * @returns {Object} Item with leavingDate added
 */
export const addLeavingDate = (item) => {
  if (!item.statusLogs || item.statusLogs.length === 0) {
    return { ...item, leavingDate: null };
  }
  
  const latestLog = item.statusLogs[0];
  return {
    ...item,
    leavingDate: latestLog.actionDate || latestLog.createdAt || null
  };
};

/**
 * Build where clause with optional filters
 * @param {Object} filters - Filter object
 * @returns {Object} Prisma where clause
 */
export const buildWhereClause = (filters) => {
  const where = {};
  
  if (filters.id) {
    where.id = parseInteger(filters.id);
  }
  
  if (filters.classId) {
    where.classId = parseInteger(filters.classId);
  } else if (filters.class) {
    where.class = filters.class;
  }
  
  if (filters.sectionId) {
    where.sectionId = parseInteger(filters.sectionId);
  } else if (filters.section) {
    where.section = filters.section;
  }
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.searchQuery && filters.searchFields) {
    const searchCondition = buildSearchCondition(filters.searchFields, filters.searchQuery);
    if (searchCondition) {
      where.OR = searchCondition.OR;
    }
  }
  
  return Object.keys(where).length > 0 ? where : undefined;
};

