const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { uploadImage, deleteImage } = require('../config/cloudinary');

// Get upload directory from environment variables or use default
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || 5242880); // 5MB default

// Ensure upload directory exists (for fallback)
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

    // Try to upload to Cloudinary first
    try {
      const publicId = `products/${uuidv4()}`;
      const cloudinaryResult = await uploadImage(file.data, 'cafe-sundus/products', publicId);
      
      return res.status(200).json({
        success: true,
        data: {
          fileName: cloudinaryResult.public_id,
          fileUrl: cloudinaryResult.secure_url,
          originalName: file.name,
          size: file.size,
          mimetype: file.mimetype,
          cloudinary: true,
        },
      });
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
      
      // Fallback to local storage
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
          cloudinary: false,
        },
      });
    }
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

    // Check if it's a Cloudinary public_id (contains '/')
    if (fileName.includes('/')) {
      try {
        const result = await deleteImage(fileName);
        return res.status(200).json({
          success: true,
          message: 'File deleted successfully from Cloudinary',
          result,
        });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        return res.status(500).json({
          success: false,
          message: 'Failed to delete file from Cloudinary',
        });
      }
    } else {
      // Handle local file deletion
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
        message: 'File deleted successfully from local storage',
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    next(error);
  }
};