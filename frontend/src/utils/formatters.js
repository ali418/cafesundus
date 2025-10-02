/**
 * Utility functions for formatting data
 */

/**
 * Format a date string to localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Format a date for API (YYYY-MM-DD)
 * @param {Date|string} date - The date to format
 * @returns {string} - Formatted date string for API
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  return date instanceof Date
    ? date.toISOString().split('T')[0]
    : new Date(date).toISOString().split('T')[0];
};

/**
 * Format a number as currency
 * @param {number|string} value - The value to format
 * @param {Object} options - Formatting options
 * @param {string} options.currency - Currency symbol
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
  const num = Number(value || 0);
  const { currency = { symbol: '$' } } = options;
  return `${currency?.symbol || ''} ${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

/**
 * Format a phone number
 * @param {string} phone - The phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Basic formatting - can be enhanced based on requirements
  return phone;
};