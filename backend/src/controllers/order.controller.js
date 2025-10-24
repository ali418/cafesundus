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
  console.log('---- DEBUG START ----');
  console.log('req.body keys:', Object.keys(req.body || {}));
  console.log('req.files keys:', req.files ? Object.keys(req.files) : 'NO FILES');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('---- DEBUG END ----');
  const transaction = await sequelize.transaction();
  
  try {
    // Check if data is sent as JSON string in orderData field (from frontend FormData)
    let orderData;
    if (req.body.orderData) {
      try {
        // تحقق من نوع البيانات المرسلة
        if (typeof req.body.orderData === 'string') {
          orderData = JSON.parse(req.body.orderData);
        } else {
          // إذا كانت البيانات مرسلة كـ object مباشرة
          orderData = req.body.orderData;
        }
      } catch (error) {
        console.error('Error parsing orderData:', error);
        console.error('Raw orderData:', req.body.orderData);
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'صيغة بيانات الطلب غير صحيحة',
          error: error.message
        });
      }
    } else {
      // If not using FormData, use the body directly
      orderData = req.body;
    }
    
    // تحقق من وجود البيانات الأساسية
    if (!orderData) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير بيانات الطلب'
      });
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

    // Map snake_case fields from body if present (fallbacks)
    {
      const b = orderData || {};
      customerName = customerName || b.customer_name || b.customerName || '';
      customerPhone = customerPhone || b.customer_phone || b.customerPhone || '';
      customerEmail = customerEmail || b.customer_email || b.customerEmail || '';
      deliveryAddress = deliveryAddress || b.delivery_address || b.address || deliveryAddress || '';

      subtotal = (typeof subtotal !== 'undefined' && subtotal !== null) ? subtotal : (typeof b.subtotal !== 'undefined' ? b.subtotal : subtotal);
      taxAmount = (typeof taxAmount !== 'undefined' && taxAmount !== null) ? taxAmount : (typeof b.tax_amount !== 'undefined' ? b.tax_amount : (typeof b.tax !== 'undefined' ? b.tax : taxAmount));
      discountAmount = (typeof discountAmount !== 'undefined' && discountAmount !== null) ? discountAmount : (typeof b.discount_amount !== 'undefined' ? b.discount_amount : (typeof b.discount !== 'undefined' ? b.discount : discountAmount));
      totalAmount = (typeof totalAmount !== 'undefined' && totalAmount !== null) ? totalAmount : (typeof b.total_amount !== 'undefined' ? b.total_amount : (typeof b.total !== 'undefined' ? b.total : totalAmount));

      paymentMethod = paymentMethod || b.payment_method || paymentMethod;
      paymentStatus = paymentStatus || b.payment_status || paymentStatus;
      notes = notes || b.notes || notes;
      customerId = customerId || b.customer_id || b.customerId || customerId;
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

    // Validate required fields - make this validation less strict for online orders
    if (!items) {
      console.log('Items not found directly, attempting to extract from request data');
      
      // Try to extract items from various possible locations in the request data
      if (orderData && orderData.items) {
        if (typeof orderData.items === 'string') {
          try {
            items = JSON.parse(orderData.items);
            console.log('Successfully parsed items from string:', items);
          } catch (parseError) {
            console.error('Failed to parse items string:', parseError);
          }
        } else if (Array.isArray(orderData.items)) {
          items = orderData.items;
          console.log('Found items array in orderData.items');
        }
      } else if (orderData && orderData.orderItems) {
        if (typeof orderData.orderItems === 'string') {
          try {
            items = JSON.parse(orderData.orderItems);
            console.log('Successfully parsed orderItems from string:', items);
          } catch (parseError) {
            console.error('Failed to parse orderItems string:', parseError);
          }
        } else if (Array.isArray(orderData.orderItems)) {
          items = orderData.orderItems;
          console.log('Found items array in orderData.orderItems');
        }
      } else if (req.body.items) {
        if (typeof req.body.items === 'string') {
          try {
            items = JSON.parse(req.body.items);
            console.log('Successfully parsed items from req.body.items string');
          } catch (parseError) {
            console.error('Failed to parse req.body.items string:', parseError);
          }
        } else if (Array.isArray(req.body.items)) {
          items = req.body.items;
          console.log('Found items array in req.body.items');
        }
      }
      
      // Log what we found or didn't find
      console.log('Items extraction result:', items ? `Found ${items.length} items` : 'No items found');
    }
    
    // Final validation after attempting to extract items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Order validation failed: No items provided', { 
        body: JSON.stringify(req.body).substring(0, 500), // Limit output size
        orderData: orderData ? JSON.stringify(orderData).substring(0, 500) : null // Limit output size
      });
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
        debug: {
          receivedFields: Object.keys(req.body),
          orderDataFields: orderData ? Object.keys(orderData) : null
        }
      });
    }

    // Find or create customer if customer data is provided
    let customer = null;
    if (customerPhone || customerEmail) {
      // Try to find existing customer by phone or email
      customer = await Customer.findOne({
        where: {
          [Op.or]: [
            customerPhone ? { phone: customerPhone } : null,
            customerEmail ? { email: customerEmail } : null
          ].filter(Boolean)
        },
        transaction
      });

      // If customer doesn't exist, create a new one
      if (!customer && (customerName || customerPhone || customerEmail)) {
        customer = await Customer.create({
          name: customerName || 'Online Customer',
          phone: customerPhone,
          email: customerEmail,
        }, { transaction });
      }
    }

    // If customerId was provided explicitly and we didn't find/create by phone/email, use it
    if (!customer && customerId) {
      try {
        const foundById = await Customer.findByPk(customerId, { transaction });
        if (foundById) {
          customer = foundById;
        } else {
          console.warn(`Provided customerId ${customerId} not found; proceeding without customer linkage`);
        }
      } catch (e) {
        console.warn('Failed to lookup provided customerId:', e?.message || e);
      }
    }

    // Process transaction image if provided
    let transactionImagePath = null;
    try {
      // If a file is uploaded via FormData
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
      } else {
        // Fallback: accept transaction_image string path from body
        const providedImage = (orderData && (orderData.transaction_image || orderData.transactionImage)) || null;
        if (providedImage && typeof providedImage === 'string') {
          // Normalize to filename stored in DB
          transactionImagePath = path.basename(providedImage);
        }

        // Only require receipt image for mobile or online payments if none provided
        // Make this check less strict - only enforce for mobile_payment
        if (paymentMethod === 'mobile_payment' && !transactionImagePath) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: 'صورة إيصال الدفع مطلوبة لطرق الدفع عبر الهاتف المحمول',
          });
        }
        
        // For online payments, log warning but don't block the order
        if (paymentMethod === 'online' && !transactionImagePath) {
          console.warn('Online payment order submitted without transaction image');
        }
      }
    } catch (imageError) {
      console.error('Error processing transaction image:', imageError);
      // Log detailed error information
      console.error('Image processing error details:', {
        message: imageError.message,
        stack: imageError.stack,
        requestBody: req.body ? Object.keys(req.body) : 'No body',
        requestFiles: req.files ? Object.keys(req.files) : 'No files'
      });
      
      // Don't fail the entire transaction for image processing errors
      // Just log the error and continue without an image
      console.warn('Continuing order creation without transaction image due to processing error');
    }
    
    // Create the sale record
    const sale = await Sale.create({
      // Only set customerId if we're sure the customer exists
      customerId: customer ? customer.id : null,
      userId: req.user.id,
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
      // Store additional customer information for later use when accepting the order
      type: 'online'
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
    
    // تحقق من نوع الخطأ لإرسال رسالة مناسبة
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: "بيانات الطلب غير صحيحة، تأكد من إدخال جميع البيانات المطلوبة بشكل صحيح",
        error: err.message
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: "فشل إنشاء الطلب، راجع السيرفر Console للتفاصيل",
      error: err.message
    });
  }
};