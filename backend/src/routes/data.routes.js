const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data.controller');
const { protect } = require('../middleware/auth');

// مسار مسح جميع البيانات - يتطلب مصادقة
router.post('/clear-all', protect, dataController.clearAllData);

module.exports = router;