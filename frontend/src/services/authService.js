/**
 * Authentication service for handling token storage and retrieval
 */

// Constants for localStorage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

/**
 * Save authentication data to localStorage
 * @param {Object|string} arg1 - Either a data object containing token, refreshToken, user; or the token string
 * @param {string} [arg2] - refreshToken (when using positional args)
 * @param {Object} [arg3] - user object (when using positional args)
 * @param {boolean} [rememberMe] - optional flag (currently not used; reserved for future behavior)
 */
export const saveAuthData = (arg1, arg2, arg3, rememberMe) => {
  let token;
  let refreshToken;
  let user;

  // Flexible signature: support both object and positional arguments
  if (typeof arg1 === 'object' && arg1 !== null) {
    token = arg1.token;
    refreshToken = arg1.refreshToken;
    user = arg1.user;
  } else {
    token = arg1;
    refreshToken = arg2;
    user = arg3;
  }

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 * @returns {string|null} The refresh token or null if not found
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Get user data from localStorage
 * @returns {Object|null} The user data or null if not found
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Check if user is authenticated based on token existence
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Initialize authentication state from localStorage
 * @returns {Object} Authentication data containing isAuthenticated and user
 */
export const initAuthFromStorage = () => {
  const token = getToken();
  const user = getUser();
  
  return {
    isAuthenticated: !!token,
    user: user,
  };
};

export default {
  saveAuthData,
  getToken,
  getRefreshToken,
  getUser,
  isAuthenticated,
  clearAuthData,
  initAuthFromStorage,
};