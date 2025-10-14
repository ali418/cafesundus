// backend/src/routes/customers.route.js
const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');

router.post('/find-or-create', customersController.findOrCreateCustomer);

module.exports = router;