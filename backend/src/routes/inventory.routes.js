const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const inventoryController = require('../controllers/inventory.controller');

/**
 * @route GET /api/v1/inventory
 * @desc Get all inventory items
 * @access Private
 */
router.get('/', inventoryController.getAllInventory);

/**
 * @route GET /api/v1/inventory/:id
 * @desc Get inventory item by ID
 * @access Private
 */
router.get('/:id', inventoryController.getInventoryById);

/**
 * @route GET /api/v1/inventory/:id/transactions
 * @desc Get inventory transaction history
 * @access Private
 */
router.get('/:id/transactions', inventoryController.getInventoryTransactions);

/**
 * @route POST /api/v1/inventory
 * @desc Create a new inventory item
 * @access Private
 */
router.post(
  '/',
  [
    body('productId').notEmpty().isInt({ min: 1 }).withMessage('Valid product ID (integer) is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
    body('location').optional(),
    body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a positive integer'),
    body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
    validateRequest,
  ],
  inventoryController.createInventory
);

/**
 * @route PUT /api/v1/inventory/:id
 * @desc Update an inventory item
 * @access Private
 */
router.put(
  '/:id',
  [
    body('location').optional(),
    body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Minimum stock level must be a positive integer'),
    body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
    validateRequest,
  ],
  inventoryController.updateInventory
);

/**
 * @route PATCH /api/v1/inventory/:id/adjust
 * @desc Adjust inventory quantity (add or subtract)
 * @access Private
 */
router.patch(
  '/:id/adjust',
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('type').isIn(['add', 'subtract']).withMessage('Type must be either "add" or "subtract"'),
    body('reason').optional(),
    validateRequest,
  ],
  inventoryController.adjustInventory
);

/**
 * @route DELETE /api/v1/inventory/:id
 * @desc Delete an inventory item
 * @access Private
 */
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;