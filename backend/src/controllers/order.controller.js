const { Sale, SaleItem, Product, Customer, User, sequelize, Sequelize } = require('../models');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const notificationController = require('./notification.controller');
const { uuidToNumericId } = require('../utils/idConverter');
const { Op } = Sequelize;

// Get upload directory from environment variables or use default
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Get orders with optional filtering by status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getOrders = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    
    // Build query options
    const queryOptions = {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'createdBy', attributes: ['id', 'fullName', 'email'] },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
      order: [['createdAt', 'DESC']],
    };
    
    // Add status filter if provided
    if (status) {
      queryOptions.where = { ...queryOptions.where, status };
    }
    
    // Add limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      queryOptions.limit = parseInt(limit);
    }
    
    const orders = await Sale.findAll(queryOptions);
    
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getOrderById = async (req, res, next) => {
  try {
    // Check if the ID is a UUID or a numeric ID
    const { findUuidByNumericId } = require('../utils/idConverter');
    let orderId = req.params.id;
    
    // If the ID looks like a numeric ID (not a UUID), try to find the corresponding UUID
    if (/^\d+$/.test(orderId)) {
      try {
        console.log(`Received numeric ID: ${orderId}, attempting to find corresponding UUID`);
        const uuid = await findUuidByNumericId(orderId, Sale);
        if (uuid) {
          console.log(`Found UUID ${uuid} for numeric ID ${orderId}`);
          orderId = uuid;
        } else {
          console.log(`No UUID found for numeric ID ${orderId}`);
        }
      } catch (error) {
        console.error(`Error converting numeric ID ${orderId} to UUID:`, error);
        // Continue with the original ID if conversion fails
      }
    }
    
    const order = await Sale.findOne({
      where: { id: orderId },
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
    
    if (!order) {
      // Try alternative search methods if the order is not found
      // This could happen if the UUID conversion failed
      try {
        // Try to find by numeric ID directly (in case it's stored as a string)
        const alternativeOrder = await Sale.findOne({
          where: { 
            id: { [Op.like]: `%${req.params.id}%` } // Partial match on ID
          },
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
        
        if (alternativeOrder) {
          return res.status(200).json({
            success: true,
            data: alternativeOrder,
          });
        }
      } catch (alternativeError) {
        console.error('Alternative search failed:', alternativeError);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Build transactionImageUrl if image exists
    const orderJson = order.toJSON ? order.toJSON() : order;
    if (orderJson && orderJson.transactionImage) {
      const img = String(orderJson.transactionImage);
      orderJson.transactionImageUrl = img.startsWith('/uploads/')
        ? img
        : img.startsWith('uploads/')
        ? '/' + img
        : `/uploads/${img}`;
    }

    return res.status(200).json({
      success: true,
      data: orderJson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateOrderStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }
    
    // Find the order
    const order = await Sale.findByPk(id, { transaction });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // Update the status
    order.status = status;
    await order.save({ transaction });
    
    // Create notification for status update
    // Convert UUID to numeric ID for relatedId
    const orderIdNumeric = uuidToNumericId(order.id);
    
    // Create notification for the customer
    if (order.userId) {
      await notificationController.createSystemNotification({
        userId: order.userId,
        type: 'order_status',
        title: 'Order Status Update',
        message: `Order #${order.id} status updated to ${status}`,
        relatedId: orderIdNumeric, // Use numeric ID derived from UUID
        relatedType: 'order'
      }, transaction);
    }
    
    // Create notification for all admins (omitting userId)
    await notificationController.createSystemNotification({
      type: 'order_status_admin',
      title: 'Order Status Updated',
      message: `Order #${order.id} status updated to ${status}`,
      relatedId: orderIdNumeric, // Use numeric ID derived from UUID
      relatedType: 'order'
    }, transaction);
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}

/**
 * Accept online order and create/link customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.acceptOnlineOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { customerName, customerPhone, customerEmail, customerData } = req.body;
    
    // Extract customer data from either direct fields or customerData object
    const finalCustomerName = customerName || customerData?.customerName;
    const finalCustomerPhone = customerPhone || customerData?.customerPhone;
    const finalCustomerEmail = customerEmail || customerData?.customerEmail;
    
    // Find the order
    const order = await Sale.findByPk(id, { transaction });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }
    
    // Find or create customer based on phone number
    let customer;
    if (customerPhone) {
      const [foundCustomer, created] = await Customer.findOrCreate({
        where: { 
          [Op.or]: [
            { phone: customerPhone },
            { email: customerEmail && customerEmail.trim() !== '' ? customerEmail : null }
          ]
        },
        defaults: {
          name: customerName || 'عميل جديد',
          phone: customerPhone,
          email: customerEmail || null,
        },
        transaction
      });
      
      customer = foundCustomer;
      
      console.log(`العميل ${created ? 'تم إنشاؤه' : 'موجود مسبقاً'} بالمعرف: ${customer.id}`);
    } else {
      // If no phone provided, try to find by email
      if (customerEmail && customerEmail.trim() !== '') {
        const [foundCustomer, created] = await Customer.findOrCreate({
          where: { email: customerEmail },
          defaults: {
            name: customerName || 'عميل جديد',
            email: customerEmail,
          },
          transaction
        });
        
        customer = foundCustomer;
        console.log(`العميل ${created ? 'تم إنشاؤه' : 'موجود مسبقاً'} بالمعرف: ${customer.id}`);
      } else {
        // If no phone or email, create a walk-in customer
        customer = await Customer.create({
          name: customerName || 'عميل زائر',
          transaction
        });
        
        console.log(`تم إنشاء عميل زائر بالمعرف: ${customer.id}`);
      }
    }
    
    // Update the order with customer ID and change status to accepted
    order.customerId = customer.id;
    order.status = 'accepted';
    order.customerName = finalCustomerName;
    order.customerPhone = finalCustomerPhone;
    order.customerEmail = finalCustomerEmail;
    await order.save({ transaction });
    
    // Create notification for status update
    const orderIdNumeric = uuidToNumericId(order.id);
    
    // Create notification for the customer
    if (order.userId) {
      await notificationController.createSystemNotification({
        userId: order.userId,
        type: 'order_status',
        title: 'تحديث حالة الطلب',
        message: `تم قبول الطلب #${orderIdNumeric}`,
        relatedId: orderIdNumeric,
        relatedType: 'order'
      }, transaction);
    }
    
    // Create notification for all admins
    await notificationController.createSystemNotification({
      type: 'order_status_admin',
      title: 'تم قبول طلب',
      message: `تم قبول الطلب #${orderIdNumeric} وربطه بالعميل ${customer.name}`,
      relatedId: orderIdNumeric,
      relatedType: 'order'
    }, transaction);
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'تم قبول الطلب وربطه بالعميل بنجاح',
      data: {
        order,
        customer
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("خطأ في قبول الطلب:", error);
    next(error);
  }
};

/**
 * Create a new order with transaction image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createOrderWithImage = async (req, res, next) => {
  const t = await sequelize.transaction();
  
  try {
    // Parse orderData from FormData or JSON body
    let orderData;
    if (req.body && typeof req.body.orderData !== 'undefined') {
      try {
        orderData = typeof req.body.orderData === 'string' ? JSON.parse(req.body.orderData) : req.body.orderData;
      } catch (e) {
        await t.rollback();
        return res.status(400).json({ success: false, message: 'صيغة بيانات الطلب غير صحيحة (orderData)', error: e.message });
      }
    } else {
      orderData = req.body;
    }

    if (!orderData) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'بيانات الطلب (orderData) مفقودة' });
    }

    const { customerData, cartItems, total } = orderData;

    if (!customerData || !customerData.phone) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'بيانات العميل أو رقم الهاتف مفقودة' });
    }

    // Explicitly ignore any client-provided ID
    if (customerData.id) {
      try {
        console.warn('Ignoring client-supplied customerData.id:', customerData.id);
      } catch (_) {}
      delete customerData.id;
    }

    // Also guard against nested id in orderData
    if (orderData.customerId) {
      try {
        console.warn('Ignoring client-supplied orderData.customerId:', orderData.customerId);
      } catch (_) {}
      delete orderData.customerId;
    }

    // Find or create customer within the same transaction using phone only
    const [customer] = await Customer.findOrCreate({
      where: { phone: String(customerData.phone || '').trim() },
      defaults: {
        name: (customerData.name || 'عميل جديد').trim(),
        email: (customerData.email || '').trim() || null,
        address: customerData.address || null,
      },
      transaction: t,
    });

    // Double-check the resolved customer actually exists in DB before referencing
    const verifiedCustomer = await Customer.findByPk(customer.id, { transaction: t, paranoid: false });
    if (!verifiedCustomer) {
      // As a fallback, create a fresh customer row and use its ID
      const fallbackCustomer = await Customer.create({
        name: (customerData.name || 'عميل جديد').trim(),
        phone: String(customerData.phone || '').trim(),
        email: (customerData.email || '').trim() || null,
        address: customerData.address || null,
      }, { transaction: t });
      console.warn('Customer verification failed; created fallback customer:', fallbackCustomer.id);
      customer.id = fallbackCustomer.id;
    }

    // Normalize items
    let items = Array.isArray(cartItems) ? cartItems : (Array.isArray(orderData.items) ? orderData.items : []);
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'يجب أن يحتوي الطلب على عنصر واحد على الأقل' });
    }

    // Map payment method values
    let paymentMethod = orderData.paymentMethod || customerData.paymentMethod || 'cash';
    const pmRaw = String(paymentMethod || '').trim();
    if (pmRaw === 'cashOnDelivery' || pmRaw === 'cash') paymentMethod = 'cash';
    else if (pmRaw === 'mobileMoney' || pmRaw === 'mobile_payment') paymentMethod = 'mobile_payment';
    else if (pmRaw === 'online') paymentMethod = 'online';
    else paymentMethod = 'cash';

    // Handle transaction image (supports express-fileupload and multer)
    let transactionImagePath = null;
    if (req.files && req.files.transactionImage) {
      const f = req.files.transactionImage;
      const fileExt = path.extname(f.name);
      const fileName = `transaction_${uuidv4()}${fileExt}`;
      const uploadPath = path.join(uploadDir, fileName);
      await f.mv(uploadPath);
      transactionImagePath = fileName;
    } else if (req.file) {
      try {
        const fileExt = path.extname(req.file.originalname || '');
        const fileName = `transaction_${uuidv4()}${fileExt}`;
        const destPath = path.join(uploadDir, fileName);
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.copyFileSync(req.file.path, destPath);
        } else if (req.file.buffer) {
          fs.writeFileSync(destPath, req.file.buffer);
        }
        transactionImagePath = fileName;
      } catch (multerErr) {
        console.error('Error processing multer file:', multerErr);
      }
    } else {
      const providedImage = (orderData && (orderData.transaction_image || orderData.transactionImage)) || null;
      if (providedImage && typeof providedImage === 'string') {
        transactionImagePath = path.basename(providedImage);
      }
    }

    // Require receipt image only for mobile payments
    if (paymentMethod === 'mobile_payment' && !transactionImagePath) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'صورة إيصال الدفع مطلوبة لطرق الدفع عبر الهاتف المحمول' });
    }

    // Totals and amounts
    const subtotalNum = items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice ?? it.price) || 0)), 0);
    const taxAmountNum = Number.isFinite(parseFloat(orderData.tax)) ? parseFloat(orderData.tax) : 0;
    const discountAmountNum = Number.isFinite(parseFloat(orderData.discount)) ? parseFloat(orderData.discount) : 0;
    const totalAmountNum = Number.isFinite(parseFloat(total)) ? parseFloat(total) : (subtotalNum + taxAmountNum - discountAmountNum);

    const deliveryAddress = orderData.deliveryAddress || customerData.address || '';
    const customerName = customerData.name || '';
    const customerPhone = customerData.phone || '';
    const customerEmail = customerData.email || '';
    const paymentStatus = orderData.paymentStatus || 'pending';
    const notes = orderData.notes || '';

    // Log to confirm safe customer ID used
    try {
      console.log('Creating Sale with safe customer ID:', { customerId: customer.id, phone: customerPhone });
    } catch (_) {}

    const sale = await Sale.create({
      customerId: customer.id,
      userId: req.user?.id || null,
      subtotal: subtotalNum,
      taxAmount: taxAmountNum,
      discountAmount: discountAmountNum,
      totalAmount: totalAmountNum,
      paymentMethod,
      paymentStatus,
      status: 'pending',
      notes,
      transactionImage: transactionImagePath,
      deliveryAddress,
      customerName,
      customerPhone,
      customerEmail,
      source: 'online',
      type: 'online'
    }, { transaction: t });

    const saleItems = items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice ?? item.price) || 0;
      const discount = parseFloat(item.discount) || 0;
      const subtotal = quantity * unitPrice;
      return {
        saleId: sale.id,
        productId: item.productId || item.id || item.product_id,
        quantity,
        unitPrice,
        discount,
        subtotal,
        totalPrice: parseFloat(item.totalPrice) || (subtotal - discount),
        notes: item.notes || '',
      };
    });

    await SaleItem.bulkCreate(saleItems, { transaction: t });

    const saleIdNumeric = uuidToNumericId(sale.id);
    await notificationController.createSystemNotification({
      type: 'new_order',
      title: 'New Online Order',
      message: `New online order #${sale.id} received`,
      relatedId: saleIdNumeric,
      relatedType: 'sale',
    }, t);

    await t.commit();
    return res.status(201).json({ success: true, data: { id: sale.id, orderNumber: sale.id, status: 'pending', message: 'تم إنشاء الطلب بنجاح' } });
  } catch (error) {
    await t.rollback();
    console.error('Error in createOrderWithImage:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم أثناء إنشاء الطلب', error: error.message });
  }
};