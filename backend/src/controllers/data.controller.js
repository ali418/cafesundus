const { Order, Sale, Customer, Notification, OrderItem, SaleItem } = require('../models');
const { sequelize } = require('../models');

// مسح جميع البيانات المتعلقة بالطلبات القديمة والمبيعات وبيانات العملاء
exports.clearAllData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    // مسح الإشعارات
    await Notification.destroy({ where: {}, transaction });
    
    // مسح عناصر الطلبات
    await OrderItem.destroy({ where: {}, transaction });
    
    // مسح الطلبات
    await Order.destroy({ where: {}, transaction });
    
    // مسح عناصر المبيعات
    await SaleItem.destroy({ where: {}, transaction });
    
    // مسح المبيعات
    await Sale.destroy({ where: {}, transaction });
    
    // مسح بيانات العملاء
    await Customer.destroy({ where: {}, transaction });
    
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      message: 'تم مسح جميع البيانات بنجاح'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};