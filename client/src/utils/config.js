/**
 * CONFIG UTILITY
 * ==============
 * Reads and exports configuration from config.json
 * Change school name and other settings in config.json
 */

import configData from '../config/config.json';

// Export configuration
export const getConfig = () => configData;

// Export specific values for convenience
export const schoolName = configData.schoolName;
export const schoolNameFull = configData.schoolNameFull;
export const copyrightYear = configData.copyrightYear || new Date().getFullYear();
export const poweredBy = configData.poweredBy;

export default configData;

