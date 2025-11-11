/**
 * DATE HELPERS
 * ============
 * Date manipulation and formatting utilities
 */

/**
 * Parse date string or return null
 * @param {string|Date} dateInput - Date input
 * @returns {Date|null} Parsed date or null
 */
export const parseDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Parse date from YYYY-MM-DD format (local date, no timezone shift)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Parsed date in UTC or null if invalid
 */
export const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  
  // Match YYYY-MM-DD format
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;
  
  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10); // 1-12
  const day = parseInt(dateMatch[3], 10);
  
  // Validate date
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  
  // Create date in UTC to avoid timezone issues
  // Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

/**
 * Get current month name and year (e.g., "January 2025")
 * @returns {string} Formatted month and year
 */
export const getCurrentMonthYear = () => {
  const date = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Format date to ISO string
 * @param {Date|string} dateInput - Date input
 * @returns {string|null} ISO string or null
 */
export const toISOString = (dateInput) => {
  const date = parseDate(dateInput);
  return date ? date.toISOString() : null;
};

/**
 * Check if date is valid
 * @param {Date|string} dateInput - Date input
 * @returns {boolean} True if valid date
 */
export const isValidDate = (dateInput) => {
  const date = parseDate(dateInput);
  return date !== null;
};

