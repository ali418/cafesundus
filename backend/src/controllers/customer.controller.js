const { Customer, Sale } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all customers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll();
    
    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createCustomer = async (req, res, next) => {
  try {
    // Check if email already exists (if provided)
    if (req.body.email) {
      const existingCustomer = await Customer.findOne({
        where: { email: req.body.email }
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists',
        });
      }
    }
    
    const customer = await Customer.create(req.body);
    
    return res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCustomer = async (req, res, next) => {
  try {
    let customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    // Check if email already exists (if being updated)
    if (req.body.email && req.body.email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        where: { email: req.body.email }
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists',
        });
      }
    }
    
    await customer.update(req.body);
    
    // Get updated customer
    customer = await Customer.findByPk(req.params.id);
    
    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a customer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    // Check if customer has associated sales
    const saleCount = await Sale.count({ where: { customerId: req.params.id } });
    
    if (saleCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with associated sales',
      });
    }
    
    await customer.destroy();
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search customers by name, email, or phone
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.searchCustomers = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { phone: { [Op.iLike]: `%${query}%` } },
        ],
      },
    });
    
    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer sales history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCustomerSales = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }
    
    const sales = await Sale.findAll({
      where: { customerId: req.params.id },
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