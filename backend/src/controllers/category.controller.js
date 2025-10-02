const { Category, Product, Sequelize } = require('../models');

/**
 * Get all categories
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();

    // Build a map of product counts by category name in a single grouped query
    const categoryNames = categories.map((c) => c.name).filter(Boolean);
    let countsMap = new Map();
    if (categoryNames.length > 0) {
      const counts = await Product.findAll({
        attributes: [
          'category',
          [Sequelize.fn('COUNT', Sequelize.col('category')), 'count']
        ],
        where: { category: categoryNames },
        group: ['category']
      });
      counts.forEach((row) => {
        const data = row.get({ plain: true });
        countsMap.set(data.category, parseInt(data.count, 10));
      });
    }

    const result = categories.map((cat) => {
      const plain = cat.get({ plain: true });
      return {
        ...plain,
        productsCount: countsMap.get(plain.name) || 0,
      };
    });
    
    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Product, as: 'products' }],
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Also attach productsCount for single category response
    const productsCount = await Product.count({ where: { category: category.name } });
    const data = category.get({ plain: true });
    
    return res.status(200).json({
      success: true,
      data: { ...data, productsCount },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    
    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    
    await category.update(req.body);
    
    // Get updated category
    category = await Category.findByPk(req.params.id);
    
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }
    
    // Check if category has associated products using string field 'category'
    const productCount = await Product.count({ where: { category: category.name } });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated products',
      });
    }
    
    await category.destroy();
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};