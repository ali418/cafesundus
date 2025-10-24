// backend/src/routes/customers.route.js
const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');
const mockAuth = require('../middleware/mockAuth');

router.post('/find-or-create', mockAuth, customersController.findOrCreateCustomer);

module.exports = router;