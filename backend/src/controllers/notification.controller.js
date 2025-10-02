const { Notification, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { uuidToNumericId } = require('../utils/idConverter');

/**
 * Get all notifications for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit, offset, isRead, type, relatedId, relatedType } = req.query;
    const userId = req.user.id;

    // Build query options
    const queryOptions = {
      where: { userId },
      order: [['createdAt', 'DESC']],
    };

    // Add isRead filter if provided
    if (isRead !== undefined) {
      queryOptions.where.isRead = isRead === 'true';
    }

    // Add type filter if provided
    if (type) {
      queryOptions.where.type = type;
    }

    // Add relatedId filter if provided
    if (relatedId) {
      queryOptions.where.relatedId = parseInt(relatedId);
    }

    // Add relatedType filter if provided
    if (relatedType) {
      queryOptions.where.relatedType = relatedType;
    }

    // Add pagination if provided
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.limit = parseInt(limit);
    }

    if (offset && !isNaN(parseInt(offset))) {
      queryOptions.offset = parseInt(offset);
    }

    // Get notifications
    const notifications = await Notification.findAndCountAll(queryOptions);

    return res.status(200).json({
      success: true,
      count: notifications.count,
      data: notifications.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notifications for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAdminNotifications = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required',
      });
    }

    const { limit, offset, isRead, type, relatedId, relatedType } = req.query;

    // Build query options
    const queryOptions = {
      where: {},
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }]
    };

    // Add isRead filter if provided
    if (isRead !== undefined) {
      queryOptions.where.isRead = isRead === 'true';
    }

    // Add type filter if provided
    if (type) {
      queryOptions.where.type = type;
    }

    // Add relatedId filter if provided
    if (relatedId) {
      queryOptions.where.relatedId = parseInt(relatedId);
    }

    // Add relatedType filter if provided
    if (relatedType) {
      queryOptions.where.relatedType = relatedType;
    }

    // Add pagination if provided
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.limit = parseInt(limit);
    }

    if (offset && !isNaN(parseInt(offset))) {
      queryOptions.offset = parseInt(offset);
    }

    // Get notifications
    const notifications = await Notification.findAndCountAll(queryOptions);

    return res.status(200).json({
      success: true,
      count: notifications.count,
      data: notifications.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get online order notifications for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getOnlineOrderNotifications = async (req, res, next) => {
  try {
    // Check if user is admin or cashier
    if (!['admin', 'cashier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or cashier role required',
      });
    }

    const { limit = 10, offset = 0, isRead } = req.query;

    // Build query options
    const queryOptions = {
      where: {
        type: 'new_order',
        relatedType: 'sale'
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'fullName'] }]
    };

    // Add isRead filter if provided
    if (isRead !== undefined) {
      queryOptions.where.isRead = isRead === 'true';
    }

    // Add pagination
    queryOptions.limit = parseInt(limit);
    queryOptions.offset = parseInt(offset);

    // Get notifications
    const notifications = await Notification.findAndCountAll(queryOptions);

    return res.status(200).json({
      success: true,
      count: notifications.count,
      data: notifications.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find notification
    const notification = await Notification.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Update notification
    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find notification
    const notification = await Notification.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Delete notification
    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete all notifications for user
    await Notification.destroy({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Count unread notifications
    const count = await Notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread online order notification count for admin/cashier
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUnreadOnlineOrderCount = async (req, res, next) => {
  try {
    // Check if user is admin or cashier
    if (!['admin', 'cashier'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or cashier role required',
      });
    }

    const count = await Notification.count({
      where: {
        type: 'new_order',
        relatedType: 'sale',
        isRead: false,
      },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a system notification
 * @param {Object} data - Notification data
 * @param {Object} transaction - Sequelize transaction object (optional)
 * @returns {Promise<Object>} Created notification
 */
exports.createSystemNotification = async (data, transaction = null) => {
  try {
    const { userId, type, title, message, relatedId, relatedType } = data;
    
    // Create notification with or without transaction
    const createOptions = transaction ? { transaction } : {};
    
    // If userId is provided, create notification for that specific user
    if (userId) {
      const notification = await Notification.create({
        userId: userId,
        type: type || 'system',
        title: title || 'System Notification',
        message: message || 'System notification',
        relatedId: relatedId || null, // Keep relatedId as INTEGER
        relatedType: relatedType || null,
        isRead: false,
      }, createOptions);
      
      return notification;
    }
    
    // If userId is not provided, create notifications for all admin users
    const adminUsers = await User.findAll({
      where: { role: 'admin', isActive: true },
      attributes: ['id']
    });
    
    // If no admin users found, use default admin UUID as fallback
    if (adminUsers.length === 0) {
      const notification = await Notification.create({
        userId: '550e8400-e29b-41d4-a716-446655440000', // Default admin UUID
        type: type || 'system',
        title: title || 'System Notification',
        message: message || 'System notification',
        relatedId: relatedId || null, // Keep relatedId as INTEGER
        relatedType: relatedType || null,
        isRead: false,
      }, createOptions);
      
      return notification;
    }
    
    // Create notifications for all admin users
    const notifications = await Promise.all(adminUsers.map(admin => {
      return Notification.create({
        userId: admin.id,
        type: type || 'system',
        title: title || 'System Notification',
        message: message || 'System notification',
        relatedId: relatedId || null, // Keep relatedId as INTEGER
        relatedType: relatedType || null,
        isRead: false,
      }, createOptions);
    }));
    
    return notifications[0]; // Return the first notification for backward compatibility
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};