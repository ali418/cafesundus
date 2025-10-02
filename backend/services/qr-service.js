/**
 * qr-service.js
 * خدمة إنشاء رموز QR للطلب عبر الإنترنت
 */

const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

class QRService {
  /**
   * إنشاء رمز QR للطلب عبر الإنترنت
   * @param {string} invoiceId - معرف الفاتورة
   * @param {string} tableId - معرف الطاولة (اختياري)
   * @param {object} options - خيارات إنشاء رمز QR
   * @returns {Promise<string>} - بيانات رمز QR بتنسيق Base64
   */
  static async generateOrderQR(invoiceId, tableId = null, options = {}) {
    try {
      // إنشاء رابط الطلب
      const baseUrl = process.env.BASE_URL || 'http://192.168.100.68:3001';
      let orderUrl = `${baseUrl}/order?invoice=${invoiceId}`;
      
      // إضافة معرف الطاولة إذا كان متوفرًا
      if (tableId) {
        orderUrl += `&table=${tableId}`;
      }
      
      console.log(`إنشاء رمز QR للرابط: ${orderUrl}`);
      
      // خيارات افتراضية لرمز QR
      const defaultOptions = {
        errorCorrectionLevel: 'H', // مستوى تصحيح الأخطاء العالي
        type: 'image/png',
        width: 300, // زيادة حجم الرمز
        margin: 2, // تقليل الهامش
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      };
      
      // دمج الخيارات المخصصة مع الخيارات الافتراضية
      const qrOptions = { ...defaultOptions, ...options };
      
      // إنشاء رمز QR
      const qrDataUrl = await QRCode.toDataURL(orderUrl, qrOptions);
      
      return qrDataUrl;
    } catch (error) {
      console.error('خطأ في إنشاء رمز QR:', error);
      throw new Error(`فشل إنشاء رمز QR: ${error.message}`);
    }
  }
  
  /**
   * إنشاء ملف رمز QR
   * @param {string} invoiceId - معرف الفاتورة
   * @param {string} outputPath - مسار حفظ ملف رمز QR
   * @param {string} tableId - معرف الطاولة (اختياري)
   * @param {object} options - خيارات إنشاء رمز QR
   * @returns {Promise<string>} - مسار ملف رمز QR
   */
  static async generateQRFile(invoiceId, outputPath, tableId = null, options = {}) {
    try {
      // إنشاء رابط الطلب
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      let orderUrl = `${baseUrl}/order?invoice=${invoiceId}`;
      
      // إضافة معرف الطاولة إذا كان متوفرًا
      if (tableId) {
        orderUrl += `&table=${tableId}`;
      }
      
      // خيارات افتراضية لرمز QR
      const defaultOptions = {
        errorCorrectionLevel: 'H', // مستوى تصحيح الأخطاء العالي
        type: 'png',
        width: 200,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      };
      
      // دمج الخيارات المخصصة مع الخيارات الافتراضية
      const qrOptions = { ...defaultOptions, ...options };
      
      // التأكد من وجود المجلد
      const outputDir = path.dirname(outputPath);
      await fs.ensureDir(outputDir);
      
      // إنشاء ملف رمز QR
      await QRCode.toFile(outputPath, orderUrl, qrOptions);
      
      return outputPath;
    } catch (error) {
      console.error('خطأ في إنشاء ملف رمز QR:', error);
      throw new Error(`فشل إنشاء ملف رمز QR: ${error.message}`);
    }
  }
  
  /**
   * إنشاء رمز QR للفاتورة
   * @param {object} invoiceData - بيانات الفاتورة
   * @returns {Promise<string>} - بيانات رمز QR بتنسيق Base64
   */
  static async generateInvoiceQR(invoiceData) {
    try {
      const { id: invoiceId, tableId } = invoiceData;
      
      // إنشاء رمز QR للطلب
      const qrData = await this.generateOrderQR(invoiceId, tableId);
      
      return qrData;
    } catch (error) {
      console.error('خطأ في إنشاء رمز QR للفاتورة:', error);
      throw new Error(`فشل إنشاء رمز QR للفاتورة: ${error.message}`);
    }
  }
}

module.exports = QRService;