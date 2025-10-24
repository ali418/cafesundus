const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const mockAuth = require('../middleware/mockAuth');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Order routes test successful' });
});

// Create order with image - IMPORTANT: Specific routes must come before dynamic routes
router.post('/with-image', mockAuth, (req, res, next) => {
  orderController.createOrderWithImage(req, res, next);
});

// Get all orders
router.get('/', protect, (req, res, next) => {
  orderController.getOrders(req, res, next);
});

// Get order by ID - This must come AFTER specific routes
router.get('/:id', protect, (req, res, next) => {
  orderController.getOrderById(req, res, next);
});

// Update order status
router.put('/:id/status', protect, (req, res, next) => {
  orderController.updateOrderStatus(req, res, next);
});

// Accept online order
router.post('/:id/accept', protect, (req, res, next) => {
  orderController.acceptOnlineOrder(req, res, next);
});

module.exports = router;