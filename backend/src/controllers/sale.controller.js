const { Sale, SaleItem, Product, Customer, Inventory, InventoryTransaction, User, sequelize } = require('../models');
const notificationController = require('./notification.controller');

/**
 * Get all sales
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllSales = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    // Build query options
    const queryOptions = {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
        { model: SaleItem, as: 'items', attributes: ['id'] },
      ],
      order: [['saleDate', 'DESC']],
    };
    
    // Add status filter if provided
    if (status) {
      queryOptions.where = { ...queryOptions.where, status };
    }
    
    // Add limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.limit = parseInt(limit);
    }
    
    const sales = await Sale.findAll(queryOptions);
    
    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sale by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
    });
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    // Add customer info for online orders if customer is null but we have customer fields
    const saleData = sale.toJSON();
    if (!saleData.customer && (saleData.deliveryAddress || saleData.customerName || saleData.customerPhone || saleData.customerEmail)) {
      saleData.customerInfo = {
        name: saleData.customerName || null,
        phone: saleData.customerPhone || null,
        email: saleData.customerEmail || null,
        address: saleData.deliveryAddress || null
      };
    }
    
    return res.status(200).json({
      success: true,
      data: saleData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createSale = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { customerId, items, paymentMethod, paymentStatus } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Sale must include at least one item',
      });
    }
    
    // Check if customer exists (if provided)
    if (customerId) {
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer not found',
        });
      }
    }
    
    // Calculate sale totals and validate inventory
    let subtotal = 0;
    const processedItems = [];
    
    for (const item of items) {
      // Validate item data
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid productId and positive quantity',
        });
      }
      
      // Get product
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found`,
        });
      }
      
      // Skip inventory check as inventory feature is removed
      // Just create a placeholder for compatibility
      const inventory = { quantity: 1000, id: 1 }; // Dummy inventory with high quantity
      
      // Calculate item subtotal
      const unitPrice = item.unitPrice || product.price;
      const discount = item.discount || 0;
      const itemSubtotal = (unitPrice * item.quantity) - discount;
      
      subtotal += itemSubtotal;
      
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount,
        subtotal: itemSubtotal,
        // notes field removed as it doesn't exist in the database
        inventory,
        previousQuantity: inventory.quantity,
      });
    }
    
    // Calculate tax and total
    const taxAmount = req.body.taxAmount || 0;
    const discountAmount = req.body.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    // Debug: Log raw incoming sale payload from client
    console.log("🚀 Sale Data Being Created (raw req.body):", {
      sale_date: req.body.sale_date,
      subtotal: req.body.subtotal,
      tax_amount: req.body.tax_amount,
      discount_amount: req.body.discount_amount,
      total_amount: req.body.total_amount,
      payment_method: req.body.payment_method,
      payment_status: req.body.payment_status,
      status: req.body.status,
      notes: req.body.notes,
      receipt_number: req.body.receipt_number,
      customer_id: req.body.customer_id,
      user_id: req.body.user_id
    });

    // Prepare the actual payload that will be sent to Sequelize
    const salePayload = {
      customerId,
      userId: (req.body && (req.body.cashierId || req.body.userId)) ? (req.body.cashierId || req.body.userId) : (req.user && req.user.id ? req.user.id : null), // Prefer cashierId/userId from body, fallback to authenticated user
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'paid'
    };

    console.log("🧾 Mapped Sale Payload (to DB):", salePayload);

    // Create sale record with detailed error logging
    let sale;
    try {
      sale = await Sale.create(salePayload, { transaction });
      console.log("✅ Sale Created Successfully:", {
        id: sale.id,
        type: typeof sale.id,
        isUUID: sale.id && sale.id.length > 30, // Simple check if it looks like a UUID
        sale: sale.toJSON ? sale.toJSON() : sale
      });
    } catch (error) {
      console.error("❌ Error Creating Sale:", error.message);
      console.error("📜 Full Error:", error);
      throw error; // Let the outer catch handle rollback and response
    }
    
    // Create sale items and update inventory
    for (const item of processedItems) {
      // Create sale item
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId, // Use actual integer product ID to match DB schema
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        totalPrice: item.subtotal,
      }, { transaction });
      
      // Skip inventory update as inventory feature is removed
      console.log('⚠️ Skipping inventory update as inventory feature is removed');
      
      // Skip inventory transaction creation
      console.log('⚠️ Skipping inventory transaction creation as inventory feature is removed');
       
       // Note: In a production environment, you would want to fix the database schema
       // by running a migration to change the inventory_id column type from UUID to INTEGER
       // or modify the model to match the database schema
    }
    
    await transaction.commit();
    
    // Get complete sale with all related data
    const completeSale = await Sale.findByPk(sale.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
    });
    
    return res.status(201).json({
      success: true,
      data: completeSale,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

/**
 * Update a sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id);
    
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ['paymentStatus', 'paymentMethod'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    await sale.update(updates);
    
    // Get updated sale with all related data
    const updatedSale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'username', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
    });
    
    return res.status(200).json({
      success: true,
      data: updatedSale,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.cancelSale = async (req, res, next) => {
  let transaction;
  
  try {
    transaction = await sequelize.transaction();
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      if (transaction && !transaction.finished) await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }
    
    const sale = await Sale.findByPk(req.params.id, {
      include: [{ 
        model: SaleItem, 
        as: 'items',
      }],
      transaction,
    });
    
    if (!sale) {
      if (transaction && !transaction.finished) await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Sale not found',
      });
    }
    
    if (sale.status === 'cancelled') {
      if (transaction && !transaction.finished) await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Sale is already cancelled',
      });
    }
    
    // Update sale status
    await sale.update({ 
      status: 'cancelled',
      paymentStatus: 'refunded',
    }, { transaction });
    
    // Skip inventory restoration as inventory feature is removed
    console.log('⚠️ Skipping inventory restoration as inventory feature is removed');
    
    // Skip inventory transaction creation
    console.log('⚠️ Skipping inventory transaction creation as inventory feature is removed');
    
    await transaction.commit();
    
    // Get updated sale with all related data
    const updatedSale = await Sale.findByPk(req.params.id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
    });
    
    return res.status(200).json({
      success: true,
      data: updatedSale,
      message: 'Sale cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    if (transaction && !transaction.finished) await transaction.rollback();
    next(error);
  }
};

/**
 * Get sales by customer ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSalesByCustomer = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    const sales = await Sale.findAll({
      where: { customerId },
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
      ],
      order: [['saleDate', 'DESC']],
    });
    
    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    next(error);
  }
};