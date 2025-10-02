const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const inventoryRoutes = require('./inventory.routes');
const salesRoutes = require('./sales.routes');
const customerRoutes = require('./customer.routes');
const reportRoutes = require('./report.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const notificationRoutes = require('./notification.routes');
const backupRoutes = require('./backup.routes');
const orderRoutes = require('./order.routes');
const mockAuth = require('../middleware/mockAuth');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

// Attach mock auth to set a default user (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Using mock authentication for development');
  router.use(mockAuth);
}

// API routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/customers', customerRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/uploads', uploadRoutes);
const settingsRoutes = require('./setting.routes');
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/backups', backupRoutes);
router.use('/orders', orderRoutes);

// 404 route
router.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = router;