/**
 * CONFIRMATION UTILITIES
 * ======================
 * Standardized confirmation dialogs
 */

/**
 * Show confirmation dialog with consistent messaging
 * @param {string} message - Confirmation message
 * @param {string} title - Optional dialog title
 * @returns {boolean} True if confirmed, false otherwise
 */
export const confirmAction = (message, title = 'Confirm Action') => {
  return window.confirm(message);
};

/**
 * Show delete confirmation dialog
 * @param {string} itemName - Name of item to delete
 * @param {string} itemType - Type of item (e.g., 'student', 'employee')
 * @param {string} additionalInfo - Optional additional warning information
 * @returns {boolean} True if confirmed, false otherwise
 */
export const confirmDelete = (itemName, itemType = 'item', additionalInfo = '') => {
  const message = `Are you sure you want to permanently delete ${itemName}? This action cannot be undone${additionalInfo ? ` and will delete all associated records (${additionalInfo}).` : '.'}`;
  return window.confirm(message);
};

/**
 * Show rejoin confirmation dialog
 * @param {string} itemName - Name of item to rejoin
 * @param {string} itemType - Type of item (e.g., 'student', 'employee')
 * @returns {boolean} True if confirmed, false otherwise
 */
export const confirmRejoin = (itemName, itemType = 'item') => {
  const message = `Are you sure you want to rejoin ${itemName}? This will change their status to ACTIVE and make their profile editable.`;
  return window.confirm(message);
};

