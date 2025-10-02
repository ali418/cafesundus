const { Product, Category } = require('../models');

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll();
    
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    next(error);
  }
};

/**
 * Get product by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    next(error);
  }
};

/**
 * Create a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Note: Category is now a string field in the products table, not a relation
    // No need to check if category exists as it's just a string value now
    
    // Make sure is_generated_barcode is properly set
    if (req.body.barcode && req.body.is_generated_barcode === undefined) {
      req.body.is_generated_barcode = false;
    }
    
    const product = await Product.create(req.body);
    
    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    // Note: Category is now a string field in the products table, not a relation
    // No need to check if category exists as it's just a string value now
    
    // Make sure is_generated_barcode is properly set
    if (req.body.barcode !== undefined) {
      // If barcode is being updated but is_generated_barcode is not specified
      if (req.body.is_generated_barcode === undefined) {
        // Keep existing is_generated_barcode value if barcode hasn't changed
        if (req.body.barcode === product.barcode) {
          req.body.is_generated_barcode = product.is_generated_barcode;
        } else {
          // Default to false for manually changed barcodes
          req.body.is_generated_barcode = false;
        }
      }
    }
    
    await product.update(req.body);
    
    // Get updated product (category is now a string field)
    product = await Product.findByPk(req.params.id);
    
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    // Attempt delete and handle FK constraint errors gracefully
    try {
      await product.destroy();
    } catch (err) {
      // Handle FK constraint violation (e.g., product referenced by sales)
      if (err?.name === 'SequelizeForeignKeyConstraintError' || err?.original?.code === '23503') {
        return res.status(409).json({
          success: false,
          message: 'ما بقدر أحذف المنتج لأنه مرتبط بسجلات أخرى (مثل المبيعات). رجاءً احذف/حدّث السجلات المرتبطة أولاً ثم حاول من جديد.',
        });
      }
      throw err;
    }
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};