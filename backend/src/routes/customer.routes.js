const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const customerController = require('../controllers/customer.controller');

/**
 * @route GET /api/v1/customers
 * @desc Get all customers
 * @access Private
 */
router.get('/', customerController.getAllCustomers);

/**
 * @route GET /api/v1/customers/:id
 * @desc Get customer by ID
 * @access Private
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route GET /api/v1/customers/:id/sales
 * @desc Get customer sales history
 * @access Private
 */
router.get('/:id/sales', customerController.getCustomerSales);

/**
 * @route POST /api/v1/customers
 * @desc Create a new customer
 * @access Private
 */
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Customer name is required'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional(),
    body('address').optional(),
    body('city').optional(),
    body('state').optional(),
    body('postalCode').optional(),
    body('country').optional(),
    body('notes').optional(),
    body('isActive').optional().isBoolean().withMessage('Active status must be a boolean'),
    validateRequest,
  ],
  customerController.createCustomer
);

/**
 * @route PUT /api/v1/customers/:id
 * @desc Update a customer
 * @access Private
 */
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Customer name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional(),
    body('address').optional(),
    body('city').optional(),
    body('state').optional(),
    body('postalCode').optional(),
    body('country').optional(),
    body('notes').optional(),
    body('isActive').optional().isBoolean().withMessage('Active status must be a boolean'),
    validateRequest,
  ],
  customerController.updateCustomer
);

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Delete a customer
 * @access Private
 */
router.delete('/:id', customerController.deleteCustomer);

/**
 * @route GET /api/v1/customers/search/:query
 * @desc Search customers by name, email, or phone
 * @access Private
 */
router.get('/search/:query', customerController.searchCustomers);

module.exports = router;