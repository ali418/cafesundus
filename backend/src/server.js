/**
 * server.js
 * خادم Express لتشغيل نظام الطلب عبر الإنترنت باستخدام رموز QR
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const morgan = require('morgan');
const QRService = require('../services/qr-service');
const InvoiceService = require('../services/invoice-service');

// إنشاء تطبيق Express
const app = express();
// Ensure Docker envs are honored
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.NODE_ENV === 'production' || process.env.DOCKER_ENVIRONMENT ? '0.0.0.0' : 'localhost';

// الإعدادات الوسيطة
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// التأكد من وجود المجلدات الضرورية
fs.ensureDirSync(path.join(__dirname, 'invoices'));
fs.ensureDirSync(path.join(__dirname, 'public'));

// مسارات API

// صفحة الطلب عبر الإنترنت
app.get('/order', (req, res) => {
  const { invoice, table } = req.query;
  
  if (!invoice) {
    return res.status(400).send('معرف الفاتورة مطلوب');
  }
  
  console.log(`تم استلام طلب لصفحة الطلب مع معرف الفاتورة: ${invoice}`);
  
  // إرسال صفحة الطلب
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

// الحصول على قائمة الطعام
app.get('/api/menu', (req, res) => {
  // في بيئة الإنتاج، يجب جلب هذه البيانات من قاعدة البيانات
  const menuItems = [
    { id: 1, name: 'قهوة عربية', price: 15.00, category: 'مشروبات ساخنة', image: '/images/arabic-coffee.jpg' },
    { id: 2, name: 'قهوة تركية', price: 12.00, category: 'مشروبات ساخنة', image: '/images/turkish-coffee.jpg' },
    { id: 3, name: 'كابتشينو', price: 18.00, category: 'مشروبات ساخنة', image: '/images/cappuccino.jpg' },
    { id: 4, name: 'لاتيه', price: 18.00, category: 'مشروبات ساخنة', image: '/images/latte.jpg' },
    { id: 5, name: 'شاي', price: 10.00, category: 'مشروبات ساخنة', image: '/images/tea.jpg' },
    { id: 6, name: 'عصير برتقال طازج', price: 18.00, category: 'مشروبات باردة', image: '/images/orange-juice.jpg' },
    { id: 7, name: 'عصير ليمون بالنعناع', price: 15.00, category: 'مشروبات باردة', image: '/images/lemon-mint.jpg' },
    { id: 8, name: 'كيك شوكولاتة', price: 25.00, category: 'حلويات', image: '/images/chocolate-cake.jpg' },
    { id: 9, name: 'كنافة', price: 30.00, category: 'حلويات', image: '/images/kunafa.jpg' },
    { id: 10, name: 'بسبوسة', price: 20.00, category: 'حلويات', image: '/images/basbousa.jpg' }
  ];
  
  res.json(menuItems);
});

// إرسال طلب جديد
app.post('/api/orders', (req, res) => {
  const { invoiceId, tableId, items, customerInfo } = req.body;
  
  if (!invoiceId || !items || items.length === 0) {
    return res.status(400).json({ error: 'بيانات الطلب غير مكتملة' });
  }
  
  // في بيئة الإنتاج، يجب حفظ الطلب في قاعدة البيانات
  console.log('تم استلام طلب جديد:');
  console.log('- معرف الفاتورة:', invoiceId);
  console.log('- معرف الطاولة:', tableId || 'غير محدد');
  console.log('- العناصر:', items);
  console.log('- معلومات العميل:', customerInfo);
  
  // إرسال استجابة نجاح
  res.status(201).json({
    success: true,
    orderId: `ORD-${Date.now()}`,
    message: 'تم استلام طلبك بنجاح'
  });
});

// إنشاء فاتورة جديدة مع رمز QR
app.post('/api/invoices', async (req, res) => {
  try {
    const invoiceData = req.body;
    
    if (!invoiceData || !invoiceData.id || !invoiceData.items || invoiceData.items.length === 0) {
      return res.status(400).json({ error: 'بيانات الفاتورة غير مكتملة' });
    }
    
    // إنشاء الفاتورة
    const invoicePath = await InvoiceService.generateInvoice(invoiceData);
    
    res.status(201).json({
      success: true,
      invoicePath: invoicePath,
      message: 'تم إنشاء الفاتورة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إنشاء الفاتورة:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الفاتورة' });
  }
});

// إنشاء رمز QR
app.get('/api/qr', async (req, res) => {
  try {
    const { invoiceId, tableId } = req.query;
    
    if (!invoiceId) {
      return res.status(400).json({ error: 'معرف الفاتورة مطلوب' });
    }
    
    // إنشاء رمز QR
    const qrData = await QRService.generateOrderQR(invoiceId, tableId);
    
    res.json({
      success: true,
      qrData: qrData
    });
  } catch (error) {
    console.error('خطأ في إنشاء رمز QR:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء رمز QR' });
  }
});

// تسجيل مسارات API لمسح البيانات
const dataRoutes = require('./routes/data.routes');
app.use('/api/v1/data', dataRoutes);

// معالجة الطرق غير الموجودة
app.use((req, res) => {
  res.status(404).send('الصفحة غير موجودة');
});

// بدء الخادم
app.listen(PORT, HOST, () => {
  console.log(`الخادم يعمل على ${HOST}:${PORT}`);
  console.log(`صفحة الطلب: http://${HOST}:${PORT}/order?invoice=EXAMPLE-INV-ID`);
});

module.exports = app; // للاختبار