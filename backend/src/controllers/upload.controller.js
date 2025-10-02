const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Get upload directory from environment variables or use default
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || 5242880); // 5MB default

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Upload a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded',
      });
    }

    const file = req.files.file;

    // Check file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the limit of ${maxFileSize / 1024 / 1024}MB`,
      });
    }

    // Check file type (optional - can be customized based on requirements)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed',
      });
    }

    // Generate a unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Move the file to the upload directory
    await file.mv(filePath);

    // Return the file URL
    const fileUrl = `/uploads/${fileName}`;
    
    return res.status(200).json({
      success: true,
      data: {
        fileName,
        fileUrl,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    next(error);
  }
};

/**
 * Delete a file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.deleteFile = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'File name is required',
      });
    }

    const filePath = path.join(uploadDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    next(error);
  }
};