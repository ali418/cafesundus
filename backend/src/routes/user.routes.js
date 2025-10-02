const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const userController = require('../controllers/user.controller');
const { User, LoginHistory } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @route GET /api/v1/users
 * @desc Get all users (admin and staff)
 * @access Private/Admin/Staff
 */
router.get('/', protect, restrictTo(['admin', 'staff']), userController.getUsers);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // If id is not in UUID format, pass to next route (e.g., '/profile')
    if (!/^([0-9a-fA-F\-]{36})$/.test(id)) {
      return next();
    }
    
    await userController.getUserById(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/v1/users
 * @desc Create a new user (admin and staff)
 * @access Private/Admin/Staff
 */
router.post(
  '/',
  protect,
  restrictTo(['admin', 'staff']),
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['admin', 'manager', 'cashier', 'user', 'storekeeper', 'accountant', 'staff']).withMessage('Invalid role'),
    validateRequest,
  ],
  userController.createUser
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update a user
 * @access Private
 */
router.put(
  '/:id',
  protect,
  [
    body('username').optional().notEmpty().withMessage('Username cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role').optional().isIn(['admin', 'manager', 'cashier', 'user', 'storekeeper', 'accountant', 'staff']).withMessage('Invalid role'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      // Only allow self-update or admin
      const isSelf = req.user.id === id;
      const isAdmin = req.user.role === 'admin';
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot update this user' });
      }
      
      // Use the controller to handle the update
      await userController.updateUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/v1/users/:id/change-password
 * @desc Change user password
 * @access Private
 */
router.patch(
  '/:id/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    validateRequest,
  ],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const isSelf = req.user.id === id;
      const isAdmin = req.user.role === 'admin';
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden: You cannot change this user\'s password' });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Admins can bypass current password check; others must provide correct current password
      if (!isAdmin) {
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
      }

      const hashed = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashed });

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete a user (admin and staff)
 * @access Private/Admin/Staff
 */
router.delete('/:id', protect, restrictTo(['admin', 'staff']), userController.deleteUser);

/**
 * @route GET /api/v1/users/profile
 * @desc Get current user profile
 * @access Private
 */
// Ensure /profile route is registered before parameterized routes to avoid shadowing
router.get('/profile', protect, async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Ensure we're using the authenticated user's ID from the token, not from mockAuth
    // This fixes the issue where profile always shows admin data
    const authenticatedUserId = req.user.id;
    
    const user = await User.findByPk(authenticatedUserId, {
      attributes: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/users/profile/login-history
 * @desc Get login history for the current authenticated user
 * @access Private
 */
router.get('/profile/login-history', protect, async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await LoginHistory.findAndCountAll({
      where: { userId: req.user.id },
      order: [['loginTime', 'DESC']],
      limit: pageSize,
      offset,
      attributes: ['id', 'userId', 'ipAddress', 'userAgent', 'device', 'status', 'loginTime', 'createdAt'],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/v1/users/:id/login-history
 * @desc Get login history for a specific user (self or admin)
 * @access Private
 */
router.get('/:id/login-history', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const isSelf = req.user.id === id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot view this user\'s login history' });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSize;

    const { rows, count } = await LoginHistory.findAndCountAll({
      where: { userId: id },
      order: [['loginTime', 'DESC']],
      limit: pageSize,
      offset,
      attributes: ['id', 'userId', 'ipAddress', 'userAgent', 'device', 'status', 'loginTime', 'createdAt'],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(count / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;