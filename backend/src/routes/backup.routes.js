const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @route POST /api/v1/backups
 * @desc Create a database backup
 * @access Private (Admin only)
 */
router.post('/', protect, restrictTo(['admin']), backupController.createBackup);

/**
 * @route GET /api/v1/backups
 * @desc List all available backups
 * @access Private (Admin only)
 */
router.get('/', protect, restrictTo(['admin']), backupController.listBackups);

/**
 * @route GET /api/v1/backups/:fileName
 * @desc Download a backup file
 * @access Private (Admin only)
 */
router.get('/:fileName', protect, restrictTo(['admin']), backupController.downloadBackup);

/**
 * @route POST /api/v1/backups/:fileName/restore
 * @desc Restore database from a backup file
 * @access Private (Admin only)
 */
router.post('/:fileName/restore', protect, restrictTo(['admin']), backupController.restoreBackup);

/**
 * @route DELETE /api/v1/backups/:fileName
 * @desc Delete a backup file
 * @access Private (Admin only)
 */
router.delete('/:fileName', protect, restrictTo(['admin']), backupController.deleteBackup);

module.exports = router;