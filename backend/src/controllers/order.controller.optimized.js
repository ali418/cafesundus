/**
 * postgresql://postgres:CzZNBTInqfVEkHFZmTvwaAeNctJVObVU@tramway.proxy.rlwy.net:43152/railway
 * نسخة محسنة من وظيفة إنشاء طلب مع صورة
 * تتبع التسلسل المنطقي الصحيح: العميل أولاً، ثم الصورة، ثم الطلب
 * مع تحسين التعامل مع الأخطاء والتحقق من البيانات
 */
exports.createOrderWithImage = async (req, res, next) => {
  // بدء معاملة قاعدة البيانات للحفاظ على تناسق البيانات
  const t = await sequelize.transaction();
  
  try {
    // 1. استخراج بيانات الطلب من الطلب (سواء كانت FormData أو JSON)
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

    // 2. تجاهل أي معرف عميل مقدم من العميل (لأمان أكبر)
    if (customerData.id) {
      console.warn('تجاهل معرف العميل المقدم من العميل:', customerData.id);
      delete customerData.id;
    }
    if (orderData.customerId) {
      console.warn('تجاهل معرف العميل المقدم في بيانات الطلب:', orderData.customerId);
      delete orderData.customerId;
    }

    // 3. البحث عن العميل أو إنشاؤه (الخطوة الأهم!)
    // استخدام findOrCreate لضمان وجود العميل قبل إنشاء الطلب
    const [customer, wasCreated] = await Customer.findOrCreate({
      where: { phone: String(customerData.phone || '').trim() },
      defaults: {
        name: (customerData.name || 'عميل جديد').trim(),
        email: (customerData.email || '').trim() || null,
        address: customerData.address || null,
      },
      transaction: t,
    });

    console.log(`العميل ${wasCreated ? 'تم إنشاؤه' : 'موجود بالفعل'} بمعرف:`, customer.id);

    // 4. التحقق من وجود العميل فعلياً في قاعدة البيانات
    const verifiedCustomer = await Customer.findByPk(customer.id, { transaction: t, paranoid: false });
    if (!verifiedCustomer) {
      // كإجراء احتياطي، إنشاء عميل جديد واستخدام معرفه
      const fallbackCustomer = await Customer.create({
        name: (customerData.name || 'عميل جديد').trim(),
        phone: String(customerData.phone || '').trim(),
        email: (customerData.email || '').trim() || null,
        address: customerData.address || null,
      }, { transaction: t });
      console.warn('فشل التحقق من العميل؛ تم إنشاء عميل احتياطي:', fallbackCustomer.id);
      customer.id = fallbackCustomer.id;
    }

    // 5. التحقق من عناصر الطلب
    let items = Array.isArray(cartItems) ? cartItems : (Array.isArray(orderData.items) ? orderData.items : []);
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'يجب أن يحتوي الطلب على عنصر واحد على الأقل' });
    }

    // 6. تحديد طريقة الدفع
    let paymentMethod = orderData.paymentMethod || customerData.paymentMethod || 'cash';
    const pmRaw = String(paymentMethod || '').trim();
    if (pmRaw === 'cashOnDelivery' || pmRaw === 'cash') paymentMethod = 'cash';
    else if (pmRaw === 'mobileMoney' || pmRaw === 'mobile_payment') paymentMethod = 'mobile_payment';
    else if (pmRaw === 'online') paymentMethod = 'online';
    else paymentMethod = 'cash';

    // 7. معالجة صورة المعاملة (يدعم express-fileupload و multer)
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
        console.error('خطأ في معالجة ملف multer:', multerErr);
      }
    } else {
      const providedImage = (orderData && (orderData.transaction_image || orderData.transactionImage)) || null;
      if (providedImage && typeof providedImage === 'string') {
        transactionImagePath = path.basename(providedImage);
      }
    }

    // 8. التحقق من وجود صورة إيصال للدفع عبر الهاتف المحمول
    if (paymentMethod === 'mobile_payment' && !transactionImagePath) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'صورة إيصال الدفع مطلوبة لطرق الدفع عبر الهاتف المحمول' });
    }

    // 9. حساب المجاميع والمبالغ
    const subtotalNum = items.reduce((sum, it) => sum + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice ?? it.price) || 0)), 0);
    const taxAmountNum = Number.isFinite(parseFloat(orderData.tax)) ? parseFloat(orderData.tax) : 0;
    const discountAmountNum = Number.isFinite(parseFloat(orderData.discount)) ? parseFloat(orderData.discount) : 0;
    const totalAmountNum = Number.isFinite(parseFloat(total)) ? parseFloat(total) : (subtotalNum + taxAmountNum - discountAmountNum);

    // 10. تجميع بيانات العميل والطلب
    const deliveryAddress = orderData.deliveryAddress || customerData.address || '';
    const customerName = customerData.name || '';
    const customerPhone = customerData.phone || '';
    const customerEmail = customerData.email || '';
    const paymentStatus = orderData.paymentStatus || 'pending';
    const notes = orderData.notes || '';

    // 11. تسجيل معرف العميل الآمن
    console.log('إنشاء مبيعة بمعرف عميل آمن:', { customerId: customer.id, phone: customerPhone });

    // 12. إنشاء سجل المبيعة (Sale)
    const sale = await Sale.create({
      customerId: customer.id, // استخدام معرف العميل الذي تم التحقق منه
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

    // 13. إنشاء عناصر المبيعة (SaleItems)
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

    // 14. إنشاء إشعار بالطلب الجديد
    const saleIdNumeric = uuidToNumericId(sale.id);
    await notificationController.createSystemNotification({
      type: 'new_order',
      title: 'طلب جديد عبر الإنترنت',
      message: `تم استلام طلب جديد عبر الإنترنت #${sale.id}`,
      relatedId: saleIdNumeric,
      relatedType: 'sale',
    }, t);

    // 15. تأكيد المعاملة وإرسال الرد
    await t.commit();
    return res.status(201).json({ 
      success: true, 
      data: { 
        id: sale.id, 
        orderNumber: sale.id, 
        status: 'pending', 
        message: 'تم إنشاء الطلب بنجاح' 
      } 
    });
  } catch (error) {
    // 16. التراجع عن المعاملة في حالة حدوث خطأ
    await t.rollback();
    console.error('خطأ في إنشاء طلب مع صورة:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في الخادم أثناء إنشاء الطلب', 
      error: error.message 
    });
  }
};