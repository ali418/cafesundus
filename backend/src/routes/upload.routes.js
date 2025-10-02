const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');

// Upload a file
router.post('/', uploadController.uploadFile);

// Delete a file
router.delete('/:fileName', uploadController.deleteFile);

module.exports = router;