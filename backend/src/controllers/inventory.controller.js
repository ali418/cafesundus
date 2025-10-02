const { Inventory, Product, InventoryTransaction, User } = require('../models');
const { sequelize } = require('../models');
const notificationController = require('./notification.controller');

/**
 * Get all inventory items
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{ model: Product, as: 'product' }],
    });
    
    return res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get inventory item by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getInventoryById = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product' }],
    });
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new inventory item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createInventory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if product exists
    const product = await Product.findByPk(req.body.productId);
    if (!product) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    // Check if inventory already exists for this product
    const existingInventory = await Inventory.findOne({
      where: { productId: req.body.productId },
      transaction,
    });
    
    if (existingInventory) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Inventory already exists for this product',
      });
    }
    
    // Create inventory record
    const inventory = await Inventory.create(req.body, { transaction });
    
    // IMPORTANT: Temporarily skip creating an InventoryTransaction here to avoid FK/schema issues
    // If you need an audit trail, use the /inventory/:id/adjust endpoint after creation
    const initialQty = Number(req.body.quantity);
    if (!Number.isNaN(initialQty) && initialQty !== 0) {
      console.warn('Skipping initial InventoryTransaction creation during createInventory()');
    }
    
    await transaction.commit();
    
    // Get inventory with product details
    const newInventory = await Inventory.findByPk(inventory.id, {
      include: [{ model: Product, as: 'product' }],
    });
    
    // Check if new inventory is below minimum stock level and create notification if needed
    if (newInventory.quantity <= newInventory.minStockLevel) {
      console.log('Low stock detected in new inventory, creating notification');
      try {
        await notificationController.createLowStockNotification(
          newInventory.productId,
          newInventory.quantity,
          newInventory.minStockLevel
        );
        console.log('Low stock notification created successfully for new inventory');
      } catch (notificationError) {
        console.error('Error creating low stock notification for new inventory:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    // Check expiry date and create notifications if expired or near expiry (within 7 days)
    try {
      const expiry = newInventory.expiryDate || (newInventory.get && newInventory.get('expiry_date'));
      if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(expiryDate.getTime())) {
          if (expiryDate <= now) {
            await notificationController.createExpiryNotification(newInventory.productId, expiryDate, 'expired');
          } else if (expiryDate.getTime() - now.getTime() <= sevenDaysMs) {
            await notificationController.createExpiryNotification(newInventory.productId, expiryDate, 'near');
          }
        }
      }
    } catch (expiryErr) {
      console.error('Error creating expiry notification for new inventory:', expiryErr);
    }
    return res.status(201).json({
      success: true,
      data: newInventory,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Update an inventory item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateInventory = async (req, res, next) => {
  try {
    let inventory = await Inventory.findByPk(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    // Don't allow direct quantity updates through this endpoint
    if (req.body.quantity !== undefined) {
      delete req.body.quantity;
    }
    
    await inventory.update(req.body);
    
    // Get updated inventory with product details
    inventory = await Inventory.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product' }],
    });
    
    // After update, check expiry date and create notifications if needed
    try {
      const expiry = inventory.expiryDate || (inventory.get && inventory.get('expiry_date'));
      if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(expiryDate.getTime())) {
          if (expiryDate <= now) {
            await notificationController.createExpiryNotification(inventory.productId, expiryDate, 'expired');
          } else if (expiryDate.getTime() - now.getTime() <= sevenDaysMs) {
            await notificationController.createExpiryNotification(inventory.productId, expiryDate, 'near');
          }
        }
      }
    } catch (expiryErr) {
      console.error('Error creating expiry notification after inventory update:', expiryErr);
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust inventory quantity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.adjustInventory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('=== ADJUST INVENTORY START ===');
    console.log('Request Params:', req.params);
    console.log('Request Body:', req.body);
    console.log('User:', req.user);
    
    const { quantity, type, reason } = req.body;
    
    if (!quantity || quantity === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-zero value',
      });
    }
    
    const inventory = await Inventory.findByPk(req.params.id, { transaction });
    console.log('Found inventory:', inventory?.toJSON());
    
    if (!inventory) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    const previousQuantity = inventory.quantity;
    let newQuantity;
    
    // Calculate new quantity based on adjustment type
    if (type === 'add') {
      newQuantity = previousQuantity + quantity;
    } else if (type === 'subtract') {
      newQuantity = previousQuantity - quantity;
      
      // Check if we have enough inventory
      if (newQuantity < 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Insufficient inventory',
        });
      }
    } else {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid adjustment type. Must be "add" or "subtract"',
      });
    }
    
    console.log(`Updating quantity from ${previousQuantity} to ${newQuantity}`);
    
    // Update inventory quantity
    await inventory.update({ quantity: newQuantity }, { transaction });
    
    console.log('Creating InventoryTransaction with:', {
      inventoryId: inventory.id,
      userId: req.user.id,
      type: 'adjustment',
      quantity: type === 'add' ? quantity : -quantity,
      previousQuantity,
      newQuantity,
      reason: reason || 'Manual adjustment',
    });
    
    // Create inventory transaction record
    await InventoryTransaction.create({
      inventoryId: inventory.id,
      userId: req.user.id, // Assuming user is attached to request by auth middleware
      type: 'adjustment',
      quantity: type === 'add' ? quantity : -quantity,
      previousQuantity,
      newQuantity,
      reason: reason || 'Manual adjustment',
    }, { transaction });
    
    await transaction.commit();
    console.log('Transaction committed successfully');
    
    // Get updated inventory with product details
    const updatedInventory = await Inventory.findByPk(req.params.id, {
      include: [{ model: Product, as: 'product' }],
    });
    
    console.log('Updated inventory response:', updatedInventory?.toJSON());
    
    // Check if inventory is below minimum stock level and create notification if needed
    if (updatedInventory.quantity <= updatedInventory.minStockLevel) {
      console.log('Low stock detected, creating notification');
      try {
        await notificationController.createLowStockNotification(
          updatedInventory.productId,
          updatedInventory.quantity,
          updatedInventory.minStockLevel
        );
        console.log('Low stock notification created successfully');
      } catch (notificationError) {
        console.error('Error creating low stock notification:', notificationError);
        // Don't fail the request if notification creation fails
      }
    }
    
    console.log('=== ADJUST INVENTORY END ===');
    
    return res.status(200).json({
      success: true,
      data: updatedInventory,
    });
  } catch (error) {
    console.error('Error in adjustInventory:', error);
    await transaction.rollback();
    next(error);
  }
};

/**
 * Delete an inventory item
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteInventory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const inventory = await Inventory.findByPk(req.params.id, { transaction });
    
    if (!inventory) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    // Check if there are any inventory transactions
    const transactionCount = await InventoryTransaction.count({
      where: { inventoryId: req.params.id },
      transaction,
    });
    
    if (transactionCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot delete inventory with transaction history',
      });
    }
    
    await inventory.destroy({ transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Inventory deleted successfully',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get inventory transaction history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getInventoryTransactions = async (req, res, next) => {
  try {
    const inventory = await Inventory.findByPk(req.params.id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }
    
    const transactions = await InventoryTransaction.findAll({
      where: { inventoryId: parseInt(req.params.id, 10) },
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] }],
      order: [[sequelize.col('created_at'), 'DESC']],
    });
    
    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};