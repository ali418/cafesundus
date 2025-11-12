const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const settingController = require('../controllers/setting.controller');

// GET /api/v1/settings - fetch settings
router.get('/', settingController.getSettings);

// PUT /api/v1/settings - update settings
router.put(
  '/',
  [
    body('store_name').optional().isString().notEmpty(),
    body('currency_code').optional().isString().notEmpty(),
    body('currency_symbol').optional().isString().notEmpty(),
    // Accept null or empty string for email, but if provided and non-empty, it must be a valid email
    body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Invalid email'),
    body('phone').optional({ nullable: true }).isString(),
    body('address').optional({ nullable: true }).isString(),
    body('city').optional({ nullable: true }).isString(),
    body('state').optional({ nullable: true }).isString(),
    body('postal_code').optional({ nullable: true }).isString(),
    body('country').optional({ nullable: true }).isString(),
    body('website').optional({ nullable: true }).isString(),
    body('tax_rate').optional({ nullable: true }).isFloat({ min: 0 }),
    body('logo_url').optional({ nullable: true }).isString(),
    body('language').optional().isString(),
    // Online order availability fields
    body('online_orders_enabled').optional({ nullable: true }).isBoolean(),
    body('online_orders_start_time').optional({ nullable: true }).isString(),
    body('online_orders_end_time').optional({ nullable: true }).isString(),
    body('online_orders_days')
      .optional({ nullable: true })
      .custom(value => {
        if (value === null || value === undefined) return true;
        if (!Array.isArray(value)) throw new Error('online_orders_days must be an array');
        const ok = value.every(v => Number.isInteger(v) && v >= 0 && v <= 6);
        if (!ok) throw new Error('online_orders_days must contain integers 0-6');
        return true;
      }),
    // Invoice fields
    body('invoice_prefix').optional({ nullable: true }).isString(),
    body('invoice_suffix').optional({ nullable: true }).isString(),
    body('invoice_next_number').optional({ nullable: true }).isInt({ min: 1 }),
    body('invoice_show_logo').optional({ nullable: true }).isBoolean(),
    body('invoice_show_tax_number').optional({ nullable: true }).isBoolean(),
    body('invoice_show_signature').optional({ nullable: true }).isBoolean(),
    body('invoice_footer_text').optional({ nullable: true }).isString(),
    body('invoice_terms_and_conditions').optional({ nullable: true }).isString(),
    // Receipt fields
    body('receipt_show_logo').optional({ nullable: true }).isBoolean(),
    body('receipt_show_tax_details').optional({ nullable: true }).isBoolean(),
    body('receipt_print_automatically').optional({ nullable: true }).isBoolean(),
    body('receipt_footer_text').optional({ nullable: true }).isString(),
    // Payment fields
    body('accept_cash').optional().isBoolean(),
    body('accept_credit_cards').optional().isBoolean(),
    body('accept_debit_cards').optional().isBoolean(),
    body('accept_mobile_payments').optional().isBoolean(),
    body('default_payment_method').optional().isString(),
    body('mtn_phone_number').optional({ nullable: true }).isString(),
    body('airtel_phone_number').optional({ nullable: true }).isString(),
    validateRequest,
  ],
  settingController.updateSettings
);

module.exports = router;