const bcrypt = require('bcryptjs');
const { User, LoginHistory } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Get query parameter for including deleted users (admin only)
    const includeDeleted = req.query.includeDeleted === 'true' && req.user.role === 'admin';
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt'],
      paranoid: !includeDeleted, // When includeDeleted is true, paranoid is false (show deleted)
    });

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role = 'user', isActive = true } = req.body;
    
    // Validate role value (must be in sync with DB enum and model)
    const validRoles = ['admin', 'manager', 'cashier', 'user', 'storekeeper', 'accountant', 'staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role value. Valid roles are: ${validRoles.join(', ')}`
      });
    }

    // Check if user already exists (include soft-deleted to avoid DB unique error)
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { username }
        ] 
      },
      paranoid: false,
      attributes: ['id', 'email', 'username', 'deletedAt']
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: existingUser.email === email 
          ? 'User with this email already exists (including deleted users). Please use a different email or restore the user.' 
          : 'Username is already taken (including deleted users). Please choose a different username.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user with proper field mapping
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName, // This maps to full_name in the database
      role,
      isActive // This maps to is_active in the database
    });
    
    // Log successful user creation
    console.log(`User created successfully: ${username} (${email})`);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      }
    });
    

    // Return user data
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    // Handle unique and validation errors gracefully
    if (error.name === 'SequelizeUniqueConstraintError') {
      const fields = [...new Set((error.errors || []).map(e => e.path))];
      const which = fields.length ? ` (${fields.join(', ')})` : '';
      return res.status(409).json({ success: false, message: `Duplicate value${which}. Email and username must be unique.` });
    }
    if (error.name === 'SequelizeValidationError') {
      const detail = error.errors && error.errors[0] ? error.errors[0].message : 'Validation error';
      return res.status(400).json({ success: false, message: detail });
    }
    next(error);
  }
};

/**
 * Update a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, password, fullName, role, isActive } = req.body;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            { id: { [Op.ne]: id } },
            { [Op.or]: [
              ...(username ? [{ username }] : []),
              ...(email ? [{ email }] : [])
            ]}
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: existingUser.email === email
            ? 'Email is already in use by another user'
            : 'Username is already taken by another user'
        });
      }
    }

    // Update user data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    await user.update(updateData);

    // Return updated user data
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user (soft delete)
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle user active status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Toggle status
    const newStatus = !user.isActive;
    await user.update({ isActive: newStatus });

    res.status(200).json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user.id,
        isActive: newStatus
      }
    });
  } catch (error) {
    next(error);
  }
};