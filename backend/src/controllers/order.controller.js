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
      console.log(`Received numeric ID: ${orderId}, attempting to find corresponding UUID`);
      const uuid = await findUuidByNumericId(orderId, Sale);
      if (uuid) {
        console.log(`Found UUID ${uuid} for numeric ID ${orderId}`);
        orderId = uuid;
      } else {
        console.log(`No UUID found for numeric ID ${orderId}`);
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
 * Create a new order with transaction image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createOrderWithImage = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if data is sent as JSON string in orderData field (from frontend FormData)
    let orderData;
    if (req.body.orderData) {
      try {
        orderData = JSON.parse(req.body.orderData);
      } catch (error) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid order data format',
        });
      }
    } else {
      // If not using FormData, use the body directly
      orderData = req.body;
    }
    
    // Extract order data
    let { 
      customerId, 
      items, 
      subtotal, 
      taxAmount, 
      discountAmount, 
      totalAmount, 
      paymentMethod, 
      paymentStatus,
      notes,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress
    } = orderData;

    // Fallback: support nested customerInfo coming from frontend (name, phone, email, address)
    if (orderData && orderData.customerInfo) {
      const info = orderData.customerInfo || {};
      customerName = customerName || info.name || '';
      customerPhone = customerPhone || info.phone || '';
      customerEmail = customerEmail || info.email || '';
      deliveryAddress = deliveryAddress || info.address || deliveryAddress || '';
      // If paymentMethod exists inside customerInfo and not already set, use it
      if (!paymentMethod && info.paymentMethod) {
        paymentMethod = info.paymentMethod;
      }
    }

    // Normalize and map paymentMethod values from frontend to backend enums
    {
      const pmRaw = (paymentMethod || '').toString().trim();
      if (!pmRaw) {
        paymentMethod = 'cash'; // default to cash on delivery
      } else if (pmRaw === 'cashOnDelivery' || pmRaw === 'cash') {
        paymentMethod = 'cash';
      } else if (pmRaw === 'mobileMoney' || pmRaw === 'mobile_payment') {
        paymentMethod = 'mobile_payment';
      } else if (pmRaw === 'online') {
        paymentMethod = 'online';
      } else {
        paymentMethod = 'cash'; // safe fallback
      }
    }

    // Compute numeric totals with fallbacks (accept tax/total from frontend if provided)
    const subtotalNum = Number.isFinite(parseFloat(subtotal))
      ? parseFloat(subtotal)
      : (Array.isArray(items)
          ? items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)), 0)
          : 0);

    const taxAmountNum = Number.isFinite(parseFloat(taxAmount))
      ? parseFloat(taxAmount)
      : (orderData && Number.isFinite(parseFloat(orderData.tax)) ? parseFloat(orderData.tax) : 0);

    const discountAmountNum = Number.isFinite(parseFloat(discountAmount))
      ? parseFloat(discountAmount)
      : 0;

    const totalAmountNum = Number.isFinite(parseFloat(totalAmount))
      ? parseFloat(totalAmount)
      : (orderData && Number.isFinite(parseFloat(orderData.total))
          ? parseFloat(orderData.total)
          : (subtotalNum + taxAmountNum - discountAmountNum));

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Handle customer information
    let customer = null;
    if (customerId) {
      // If customer ID is provided, verify it exists
      customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer not found',
        });
      }
    } else if (customerName || customerPhone || customerEmail) {
      try {
        // استخدام خدمة البحث عن العميل أو إنشائه
        const customerData = {
          name: customerName || 'Walk-in Customer',
          email: customerEmail || null,
          phone: customerPhone || null,
          address: deliveryAddress || null
        };
        
        // البحث عن العميل أو إنشائه باستخدام المنطق المشترك
        const { Op } = Sequelize;
        
        // البحث عن العميل بالبريد الإلكتروني أو رقم الهاتف
        if (customerEmail || customerPhone) {
          const whereClause = {
            [Op.or]: [
              customerEmail ? { email: customerEmail } : null,
              customerPhone ? { phone: customerPhone } : null
            ].filter(Boolean)
          };
          
          customer = await Customer.findOne({
            where: whereClause,
            transaction
          });
        }
        
        // إذا وجدنا العميل، نقوم بتحديث بياناته إذا لزم الأمر
        if (customer) {
          customerId = customer.id;
          
          // تحديث معلومات العميل إذا لزم الأمر
          const updates = {};
          if (customerName && !customer.name) updates.name = customerName;
          if (customerEmail && !customer.email) updates.email = customerEmail;
          if (customerPhone && !customer.phone) updates.phone = customerPhone;
          if (deliveryAddress && !customer.address) updates.address = deliveryAddress;
          
          if (Object.keys(updates).length > 0) {
            await customer.update(updates, { transaction });
          }
        } else {
          // إذا لم يوجد العميل، نقوم بإنشاء عميل جديد
          customer = await Customer.create({
            name: customerName || 'Walk-in Customer',
            phone: customerPhone || null,
            email: customerEmail || null,
            address: deliveryAddress || null,
          }, { transaction });
          customerId = customer.id;
        }
      } catch (customerError) {
        console.error('Error handling customer data:', customerError);
        // نستمر في إنشاء الطلب حتى لو فشلت عملية العميل
      }
    }
    
    // Process transaction image if provided
    let transactionImagePath = null;
    try {
      if (req.files && req.files.transactionImage) {
        const transactionImage = req.files.transactionImage;
        const fileExt = path.extname(transactionImage.name);
        const fileName = `transaction_${uuidv4()}${fileExt}`;
        
        // Ensure uploadDir exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const uploadPath = path.join(uploadDir, fileName);
        
        // Move the file to the upload directory
        await transactionImage.mv(uploadPath);
        transactionImagePath = fileName;
      } else if (paymentMethod === 'mobile_payment' || paymentMethod === 'online') {
        // Require receipt image for mobile or online payments
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'صورة إيصال الدفع مطلوبة لطرق الدفع عبر الهاتف أو الإنترنت',
        });
      }
    } catch (imageError) {
      console.error('Error processing transaction image:', imageError);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء معالجة صورة المعاملة',
        error: imageError.message
      });
    }
    
    // Create the sale record
    const sale = await Sale.create({
      customerId,
      userId: req.user ? req.user.id : '550e8400-e29b-41d4-a716-446655440000', // Use authenticated user or default admin UUID
      subtotal: subtotalNum,
      taxAmount: taxAmountNum,
      discountAmount: discountAmountNum,
      totalAmount: totalAmountNum,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || 'pending',
      status: 'pending', // Initial status for online orders
      notes: notes || '',
      transactionImage: transactionImagePath,
      deliveryAddress: deliveryAddress || '',
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      source: 'online', // Mark as online order
    }, { transaction });
    
    // Create sale items
    if (items && items.length > 0) {
      const saleItems = items.map(item => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        // Calculate subtotal as quantity * unitPrice
        const subtotal = quantity * unitPrice;
        
        return {
          saleId: sale.id,
          productId: item.productId,
          quantity: quantity,
          unitPrice: unitPrice,
          discount: discount,
          subtotal: subtotal,
          totalPrice: parseFloat(item.totalPrice) || subtotal - discount,
          notes: item.notes || '',
        };
      });
      
      await SaleItem.bulkCreate(saleItems, { transaction });
    }

    // Create notification for new online order for all admin users
    // Convert UUID to numeric ID for relatedId
    const saleIdNumeric = uuidToNumericId(sale.id);
    await notificationController.createSystemNotification({
      // userId is not provided to send to all admin users
      type: 'new_order',
      title: 'New Online Order',
      message: `New online order #${sale.id} received`,
      relatedId: saleIdNumeric, // Use numeric ID derived from UUID
      relatedType: 'sale',
    }, transaction);

    await transaction.commit();

    return res.status(201).json({
      success: true,
      data: {
        id: sale.id,
        orderNumber: sale.id,
        status: 'pending',
        message: 'Order created successfully',
      },
    });
  } catch (err) {
    await transaction.rollback();
    
    // طباعة تفاصيل المشكلة
    console.error("🔥 خطأ أثناء إنشاء الطلب:");
    console.error("📌 الرسالة:", err.message);
    console.error("📌 النوع:", err.name);
    if (err.errors) {
      console.error("📌 تفاصيل الحقول:", err.errors.map(e => ({
        message: e.message,
        path: e.path,
        value: e.value
      })));
    }
    console.error("📌 الكود كامل:", err);
    
    return res.status(500).json({ 
      success: false, 
      error: "فشل إنشاء الطلب، راجع السيرفر Console للتفاصيل" 
    });
  }
};