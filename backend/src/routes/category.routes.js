const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const categoryController = require('../controllers/category.controller');

/**
 * @route GET /api/v1/categories
 * @desc Get all categories
 * @access Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route GET /api/v1/categories/:id
 * @desc Get category by ID
 * @access Public
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * @route POST /api/v1/categories
 * @desc Create a new category
 * @access Private
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('description').optional(),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  categoryController.createCategory
);

/**
 * @route PUT /api/v1/categories/:id
 * @desc Update a category
 * @access Private
 */
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
    body('description').optional(),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  categoryController.updateCategory
);

/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a category
 * @access Private
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;