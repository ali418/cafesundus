/**
 * Utility functions for converting between UUID and numeric IDs
 */

/**
 * Converts a UUID to a numeric ID (INTEGER)
 * This is useful for systems that require numeric IDs but work with UUIDs
 * 
 * @param {string} uuid - The UUID to convert
 * @param {number} maxDigits - Maximum number of digits for the result (default: 6)
 * @returns {number} A numeric ID derived from the UUID
 */
exports.uuidToNumericId = (uuid, maxDigits = 9) => {
  if (!uuid) return null;
  
  try {
    // Remove hyphens and take first 12 characters of the UUID for larger range
    const hexSubstring = uuid.toString().replace(/-/g, '').substring(0, 12);
    
    // Convert hex to decimal
    const decimal = parseInt(hexSubstring, 16);
    
    // Ensure the result has at most maxDigits by using modulo
    const maxValue = Math.pow(10, maxDigits);
    return decimal % maxValue;
  } catch (error) {
    console.error('Error converting UUID to numeric ID:', error);
    return null;
  }
};

/**
 * Finds a UUID that corresponds to a numeric ID
 * This is useful for looking up UUIDs when only numeric IDs are available
 * 
 * @param {number} numericId - The numeric ID to find a UUID for
 * @param {Object} model - The Sequelize model to search in
 * @param {number} maxDigits - Maximum number of digits for the numeric ID (default: 9)
 * @returns {string|null} The first UUID that converts to the given numeric ID, or null if none found
 */
exports.findUuidByNumericId = async (numericId, model, maxDigits = 9) => {
  if (!numericId || !model) return null;
  
  try {
    // Convert numericId to a number if it's a string
    const targetId = parseInt(numericId, 10);
    if (Number.isNaN(targetId)) return null;

    // Get only the IDs from the model for better performance
    const records = await model.findAll({
      attributes: ['id'],
      raw: true,
      limit: 100 // Limit to prevent performance issues with large tables
    });
    
    // Find the first record whose UUID converts to the target numeric ID
    for (const record of records) {
      const recordNumericId = exports.uuidToNumericId(record.id, maxDigits);
      if (recordNumericId === targetId) {
        return record.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding UUID by numeric ID:', error?.message || error);
    return null;
  }
};

/**
 * Generates a display ID from a UUID
 * This is useful for displaying shorter, more user-friendly IDs in the UI
 * 
 * @param {string} uuid - The UUID to convert
 * @param {number} length - Length of the display ID (default: 8)
 * @returns {string} A shortened display ID
 */
exports.getDisplayId = (uuid, length = 8) => {
  if (!uuid) return '';
  
  try {
    // Remove hyphens and take first n characters
    return uuid.toString().replace(/-/g, '').substring(0, length);
  } catch (error) {
    console.error('Error generating display ID:', error);
    return '';
  }
};