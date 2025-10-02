const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const mockAuth = require('../middleware/mockAuth');
// const validateRequest = require('../middleware/validateRequest');

// Apply authentication middleware to all notification routes
router.use(mockAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/admin
 * @desc    Get all notifications for admin dashboard
 * @access  Private/Admin
 */
router.get('/admin', notificationController.getAdminNotifications);

/**
 * @route   GET /api/notifications/online-orders
 * @desc    Get online order notifications for admin/cashier
 * @access  Private/Admin/Cashier
 */
router.get('/online-orders', notificationController.getOnlineOrderNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for the current user
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/unread-online-orders-count
 * @desc    Get unread online order notification count for admin/cashier
 * @access  Private/Admin/Cashier
 */
router.get('/unread-online-orders-count', notificationController.getUnreadOnlineOrderCount);

/**
 * @route   PUT/PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read for the current user
 * @access  Private
 */
router.put('/mark-all-read', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

// Route removed as createNotification function no longer exists in the controller

module.exports = router;