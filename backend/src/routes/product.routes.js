const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const productController = require('../controllers/product.controller');

/**
 * @route GET /api/v1/products
 * @desc Get all products
 * @access Public
 */
router.get('/', productController.getAllProducts);

/**
 * @route GET /api/v1/products/:id
 * @desc Get product by ID
 * @access Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route POST /api/v1/products
 * @desc Create a new product
 * @access Private
 */
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Product name is required'),
    body('price').toFloat().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('stock').optional().toInt().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('description').optional().isString(),
    body('image_url').optional({ nullable: true, checkFalsy: true }).isString().withMessage('Image URL must be a string'),
    body('barcode').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 50 }).withMessage('Barcode must be a string up to 50 characters'),
    validateRequest,
  ],
  productController.createProduct
);

/**
 * @route PUT /api/v1/products/:id
 * @desc Update a product
 * @access Private
 */
router.put(
  '/:id',
  [
    body('name').optional().isString().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().toFloat().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('stock').optional().toInt().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('description').optional().isString(),
    body('image_url').optional({ nullable: true, checkFalsy: true }).isString().withMessage('Image URL must be a string'),
    body('barcode').optional({ nullable: true, checkFalsy: true }).isString().isLength({ max: 50 }).withMessage('Barcode must be a string up to 50 characters'),
    validateRequest,
  ],
  productController.updateProduct
);

/**
 * @route DELETE /api/v1/products/:id
 * @desc Delete a product
 * @access Private
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;