const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const saleController = require('../controllers/sale.controller');

/**
 * @route GET /api/v1/sales
 * @desc Get all sales
 * @access Private
 */
router.get('/', saleController.getAllSales);

/**
 * @route GET /api/v1/sales/:id
 * @desc Get sale by ID
 * @access Private
 */
router.get('/:id', saleController.getSaleById);

/**
 * @route POST /api/v1/sales
 * @desc Create a new sale
 * @access Private
 */
router.post(
  '/',
  [
    body('customerId').optional().isUUID().withMessage('Valid customer ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().isInt().withMessage('Valid product ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('items.*.unitPrice').optional().isNumeric().withMessage('Unit price must be a number'),
    body('items.*.discount').optional().isNumeric().withMessage('Discount must be a number'),
    body('subtotal').optional().isNumeric().withMessage('Subtotal must be a number'),
    body('taxAmount').optional().isNumeric().withMessage('Tax amount must be a number'),
    body('discountAmount').optional().isNumeric().withMessage('Discount amount must be a number'),
    body('totalAmount').optional().isNumeric().withMessage('Total amount must be a number'),
    body('paymentMethod').isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other', 'card'])
      .withMessage('Invalid payment method'),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'partially_paid', 'refunded'])
      .withMessage('Invalid payment status'),
    body('notes').optional(),
    validateRequest,
  ],
  saleController.createSale
);

/**
 * @route PUT /api/v1/sales/:id
 * @desc Update a sale (limited to certain fields)
 * @access Private
 */
router.put(
  '/:id',
  [
    body('status').optional().isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('paymentStatus').optional().isIn(['pending', 'paid', 'partially_paid', 'refunded']).withMessage('Invalid payment status'),
    body('paymentMethod').optional().isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'])
      .withMessage('Invalid payment method'),
    body('notes').optional(),
    validateRequest,
  ],
  saleController.updateSale
);

/**
 * @route DELETE /api/v1/sales/:id
 * @desc Cancel a sale (soft delete)
 * @access Private
 */
router.delete('/:id', saleController.cancelSale);

/**
 * @route GET /api/v1/sales/customer/:customerId
 * @desc Get sales by customer ID
 * @access Private
 */
router.get('/customer/:customerId', saleController.getSalesByCustomer);

module.exports = router;