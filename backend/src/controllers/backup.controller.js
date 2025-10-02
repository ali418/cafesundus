const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const { sequelize } = require('../models');

// Get backup directory from environment variables or use default
const backupDir = process.env.BACKUP_DIR || 'backups';

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

/**
 * Create database backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.createBackup = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);
    
    // Get database connection info from sequelize
    const config = sequelize.config;
    const { database, username, password, host, port } = config;
    
    // Create pg_dump command
    const pgDumpCmd = `pg_dump -h ${host} -p ${port} -U ${username} -F c -b -v -f "${backupFilePath}" ${database}`;
    
    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute pg_dump
    await execPromise(pgDumpCmd, { env });
    
    return res.status(200).json({
      success: true,
      message: 'Database backup created successfully',
      data: {
        fileName: backupFileName,
        filePath: backupFilePath,
        timestamp: timestamp,
        size: fs.statSync(backupFilePath).size,
      },
    });
  } catch (error) {
    console.error('Error creating database backup:', error);
    next(error);
  }
};

/**
 * Restore database from backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.restoreBackup = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }
    
    const backupFilePath = path.join(backupDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }
    
    // Get database connection info from sequelize
    const config = sequelize.config;
    const { database, username, password, host, port } = config;
    
    // Create pg_restore command
    const pgRestoreCmd = `pg_restore -h ${host} -p ${port} -U ${username} -d ${database} -c -v "${backupFilePath}"`;
    
    // Set environment variable for password
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute pg_restore
    await execPromise(pgRestoreCmd, { env });
    
    return res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      data: {
        fileName: fileName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error restoring database:', error);
    next(error);
  }
};

/**
 * List available backups
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.listBackups = async (req, res, next) => {
  try {
    const files = fs.readdirSync(backupDir);
    
    // Filter only .sql files and get their stats
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          fileName: file,
          filePath: filePath,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      // Sort by creation date (newest first)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return res.status(200).json({
      success: true,
      count: backups.length,
      data: backups,
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    next(error);
  }
};

/**
 * Delete a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteBackup = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }
    
    const backupFilePath = path.join(backupDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }
    
    // Delete the file
    fs.unlinkSync(backupFilePath);
    
    return res.status(200).json({
      success: true,
      message: 'Backup deleted successfully',
      data: {
        fileName: fileName,
      },
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    next(error);
  }
};

/**
 * Download a backup
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.downloadBackup = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'Backup file name is required',
      });
    }
    
    const backupFilePath = path.join(backupDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found',
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(backupFilePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    next(error);
  }
};