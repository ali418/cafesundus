const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    validateRequest,
  ],
  authController.register
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  authController.login
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh JWT token
 * @access Public (with refresh token)
 */
router.post('/refresh', authController.refreshToken);

// Alias to support clients using /refresh-token
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc Logout user / invalidate refresh token
 * @access Private
 */
router.post('/logout', authController.logout);

module.exports = router;