/**
 * DATE FORMATTING UTILITY
 * =======================
 * Formats ISO dates from backend to readable format
 * Uses UTC methods to avoid timezone conversion issues
 */

/**
 * Format date to DD/MM/YYYY using UTC (prevents timezone issues)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted date as DD/MM/YYYY or 'N/A' if invalid
 */
export const formatDateUTC = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    
    // Use UTC methods to avoid timezone conversion
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date to readable format (e.g., "Jan 15, 2024")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date or 'N/A' if invalid
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date and time to readable format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time or 'N/A' if invalid
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Format date to locale date string
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Locale date string or 'N/A' if invalid
 */
export const formatLocaleDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
};

