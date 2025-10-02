const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token and sets req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      const error = new Error('Not authorized, no token provided');
      error.statusCode = 401;
      throw error;
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Set user in request object
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      };
      
      next();
    } catch (err) {
      const error = new Error('Not authorized, token invalid');
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to admin users only
 * Must be used after protect middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.restrictTo = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('User not authenticated');
      error.statusCode = 401;
      return next(error);
    }
    
    if (!roles.includes(req.user.role)) {
      const error = new Error(`Access denied. ${roles.join(' or ')} role required`);
      error.statusCode = 403;
      return next(error);
    }
    
    next();
  };
};