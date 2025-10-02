const { Sale, SaleItem, Product, Inventory, Category, Customer } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate sales report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.salesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }
    
    // Get sales within date range
    const sales = await Sale.findAll({
      where: {
        [Op.and]: [
          sequelize.where(sequelize.col('Sale.sale_date'), {
            [Op.between]: [start, end],
          }),
          { status: 'completed' }, // Only include completed sales
        ],
      },
      include: [
        { model: Customer, as: 'customer' },
        { 
          model: SaleItem, 
          as: 'items',
          include: [{ model: Product }],
        },
      ],
      order: [[sequelize.col('Sale.sale_date'), 'ASC']],
    });
    
    // Calculate summary statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalItems = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    // Group sales by date
    const salesByDate = {};
    sales.forEach(sale => {
      // Use sale_date field or fallback to saleDate getter
      const saleDate = sale.get('sale_date') || sale.get('saleDate') || sale.saleDate;
      const date = saleDate.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          count: 0,
          revenue: 0,
        };
      }
      salesByDate[date].count += 1;
      salesByDate[date].revenue += parseFloat(sale.totalAmount || sale.get('total_amount'));
    });
    
    // Convert to array and sort by date
    const dailySales = Object.values(salesByDate).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalRevenue,
          totalItems,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
        },
        dailySales,
        sales,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate inventory status report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.inventoryStatusReport = async (req, res, next) => {
  try {
    const inventory = await Inventory.findAll({
      include: [{ model: Product, as: 'product', required: false }],
    });
    
    // Calculate summary statistics
    const totalProducts = inventory.length;
    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lowStockItems = inventory.filter(item => {
      const minLevel = (item.minStockLevel ?? item.get('min_quantity') ?? 0);
      return (item.quantity || 0) <= minLevel;
    }).length;
    
    // Group by category (using product.category string field)
    const inventoryByCategory = {};
    inventory.forEach(item => {
      const categoryName = (item.product && item.product.category) ? item.product.category : 'Uncategorized';
      if (!inventoryByCategory[categoryName]) {
        inventoryByCategory[categoryName] = {
          category: categoryName,
          productCount: 0,
          totalQuantity: 0,
          items: [],
        };
      }
      inventoryByCategory[categoryName].productCount += 1;
      inventoryByCategory[categoryName].totalQuantity += (item.quantity || 0);
      inventoryByCategory[categoryName].items.push({
        id: item.id,
        productId: item.productId,
        productName: (item.product && item.product.name) ? item.product.name : 'Unknown',
        quantity: (item.quantity || 0),
        minStockLevel: (item.minStockLevel ?? item.get('min_quantity') ?? 0),
        isLowStock: (item.quantity || 0) <= (item.minStockLevel ?? item.get('min_quantity') ?? 0),
      });
    });
    
    // Convert to array
    const categorySummary = Object.values(inventoryByCategory);
    
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalItems,
          lowStockItems,
        },
        categorySummary,
        inventory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate low stock report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.lowStockReport = async (req, res, next) => {
  try {
    const lowStockItems = await Inventory.findAll({
      where: sequelize.literal('quantity <= min_quantity'),
      include: [{ model: Product, as: 'product' }],
      order: [['quantity', 'ASC']],
    });
    
    return res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate top selling products report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.topSellingProductsReport = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }
    
    // Get top selling products
    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.subtotal')), 'totalRevenue'],
      ],
      include: [
        { 
          model: Product,
          attributes: ['id', 'name', 'price', 'category'],
          // NOTE: Product no longer associates to Category; keep attributes minimal
        },
        {
          model: Sale,
          attributes: [],
          where: {
            [Op.and]: [
              sequelize.where(sequelize.col('Sale.sale_date'), {
                [Op.between]: [start, end],
              }),
              { status: 'completed' },
            ],
          },
        },
      ],
      group: ['productId', 'Product.id'],
      order: [[sequelize.literal('SUM("SaleItem"."quantity")'), 'DESC']],
      limit: parseInt(limit),
    });
    
    return res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate revenue report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.revenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }
    
    // Validate groupBy parameter
    const validGroupings = ['day', 'week', 'month'];
    if (!validGroupings.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid groupBy parameter. Must be one of: day, week, month',
      });
    }
    
    // Define date format based on grouping (PostgreSQL)
    let granularity;
    let format;
    switch (groupBy) {
      case 'day':
        granularity = 'day';
        format = 'YYYY-MM-DD';
        break;
      case 'week':
        granularity = 'week';
        format = 'IYYY-IW'; // ISO week format
        break;
      case 'month':
      default:
        granularity = 'month';
        format = 'YYYY-MM';
        break;
    }
    const periodTrunc = sequelize.fn('date_trunc', granularity, sequelize.col('Sale.sale_date'));

    // Get revenue data (PostgreSQL-friendly)
    const revenueData = await Sale.findAll({
      attributes: [
        [periodTrunc, 'period_date'],
        [sequelize.fn('TO_CHAR', periodTrunc, format), 'period'],
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'saleCount'],
        [sequelize.fn('SUM', sequelize.col('Sale.total_amount')), 'revenue'],
        [sequelize.fn('SUM', sequelize.col('Sale.subtotal')), 'subtotal'],
        [sequelize.fn('SUM', sequelize.col('Sale.tax_amount')), 'tax'],
        [sequelize.fn('SUM', sequelize.col('Sale.discount_amount')), 'discount'],
      ],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.col('Sale.sale_date'), {
            [Op.between]: [start, end],
          }),
          { status: 'completed' },
        ],
      },
      group: ['period_date'],
      order: [[sequelize.literal('period_date'), 'ASC']],
    });
    
    // Calculate summary statistics
    const totalSales = revenueData.reduce((sum, item) => sum + parseInt(item.dataValues.saleCount), 0);
    const totalRevenue = revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.revenue), 0);
    const totalTax = revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.tax), 0);
    const totalDiscount = revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.discount), 0);
    
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalRevenue,
          totalTax,
          totalDiscount,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          groupBy,
        },
        revenueData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate sales by category report
 */
exports.salesByCategoryReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const rows = await SaleItem.findAll({
      attributes: [
        [sequelize.col('Product.category'), 'category'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.subtotal')), 'totalRevenue'],
      ],
      include: [
        { model: Product, attributes: [] },
        {
          model: Sale,
          attributes: [],
          where: {
            [Op.and]: [
              sequelize.where(sequelize.col('Sale.sale_date'), {
                [Op.between]: [start, end],
              }),
              { status: 'completed' },
            ],
          },
        },
      ],
      group: ['Product.category'],
      order: [[sequelize.literal('SUM("SaleItem"."subtotal")'), 'DESC']],
    });

    const data = rows.map(r => ({
      category: r.get('category') || 'Uncategorized',
      totalQuantity: parseInt(r.get('totalQuantity') || '0', 10),
      totalRevenue: parseFloat(r.get('totalRevenue') || '0'),
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate customers report (visits and top customers)
 */
exports.customersReport = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const rows = await Sale.findAll({
      attributes: [
        [sequelize.col('Sale.customer_id'), 'customerId'],
        [sequelize.fn('COUNT', sequelize.col('Sale.id')), 'saleCount'],
        [sequelize.fn('SUM', sequelize.col('Sale.total_amount')), 'totalSpent'],
        [sequelize.fn('MAX', sequelize.col('Sale.sale_date')), 'lastPurchaseDate'],
      ],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      where: {
        [Op.and]: [
          sequelize.where(sequelize.col('Sale.sale_date'), {
            [Op.between]: [start, end],
          }),
          { status: 'completed' },
          { customerId: { [Op.ne]: null } },
        ],
      },
      group: [sequelize.col('Sale.customer_id'), 'customer.id'],
      order: [[sequelize.literal('SUM("Sale"."total_amount")'), 'DESC']],
    });

    const customers = rows.map(r => ({
      customerId: r.customer?.id || r.customerId,
      name: r.customer?.name || 'Unknown Customer',
      email: r.customer?.email || null,
      phone: r.customer?.phone || null,
      saleCount: parseInt(r.get('saleCount') || '0', 10),
      totalSpent: parseFloat(r.get('totalSpent') || '0'),
      lastPurchaseDate: r.get('lastPurchaseDate'),
    }));

    const summary = {
      totalCustomers: customers.length,
      totalVisits: customers.reduce((s, c) => s + c.saleCount, 0),
      totalRevenue: customers.reduce((s, c) => s + c.totalSpent, 0),
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };

    const topCustomers = typeof limit !== 'undefined' ? customers.slice(0, parseInt(limit, 10)) : customers;

    return res.status(200).json({ success: true, data: { summary, customers: topCustomers } });
  } catch (error) {
    next(error);
  }
};