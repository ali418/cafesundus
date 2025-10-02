const { Sale } = require('../models');
const { v4: uuidv4 } = require('uuid');

async function addSaleRecord() {
  try {
    // إنشاء سجل مبيعات جديد مع relatedId يساوي 728756
    const newSale = await Sale.create({
      id: uuidv4(),
      saleDate: new Date(),
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      relatedId: 728756,
      source: 'pos',
      customerName: 'عميل افتراضي',
      customerPhone: '0000000000'
    });

    console.log('تم إنشاء سجل المبيعات بنجاح:', newSale.toJSON());
    return newSale;
  } catch (error) {
    console.error('خطأ في إنشاء سجل المبيعات:', error);
    console.error('تفاصيل الخطأ:', error.parent);
    throw error;
  }
}

// تنفيذ الدالة
addSaleRecord()
  .then(() => {
    console.log('تمت العملية بنجاح');
    process.exit(0);
  })
  .catch(error => {
    console.error('فشلت العملية:', error);
    process.exit(1);
  });