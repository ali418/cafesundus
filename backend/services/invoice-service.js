/**
 * invoice-service.js
 * خدمة إنشاء الفواتير مع رموز QR للطلب عبر الإنترنت
 */

const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const QRService = require('./qr-service');

class InvoiceService {
  /**
   * إنشاء فاتورة جديدة مع رمز QR
   * @param {object} invoiceData - بيانات الفاتورة
   * @returns {Promise<string>} - مسار ملف الفاتورة
   */
  static async generateInvoice(invoiceData) {
    try {
      const { id, date, time, tableId, customer, items, tax = 15 } = invoiceData;
      
      // إنشاء مجلد الفواتير إذا لم يكن موجودًا
      const invoicesDir = path.join(process.cwd(), 'invoices');
      await fs.ensureDir(invoicesDir);
      
      // مسار ملف الفاتورة
      const invoicePath = path.join(invoicesDir, `${id}.pdf`);
      
      // إنشاء مستند PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `فاتورة ${id}`,
          Author: 'كافيه سندس',
          Subject: 'فاتورة',
          Keywords: 'فاتورة, كافيه سندس, طلب',
          CreationDate: new Date()
        }
      });
      
      // إنشاء تدفق الكتابة
      const writeStream = fs.createWriteStream(invoicePath);
      doc.pipe(writeStream);
      
      // إضافة ترويسة الفاتورة
      await this._addHeader(doc, id, date, time, tableId);
      
      // إضافة معلومات العميل
      this._addCustomerInfo(doc, customer);
      
      // إضافة جدول العناصر
      this._addItemsTable(doc, items);
      
      // حساب المجموع
      const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const taxAmount = (subtotal * tax) / 100;
      const total = subtotal + taxAmount;
      
      // إضافة ملخص المجموع
      this._addTotalSummary(doc, subtotal, tax, taxAmount, total);
      
      // إنشاء رمز QR للطلب
      const qrData = await QRService.generateInvoiceQR(invoiceData);
      
      // إضافة رمز QR
      await this._addQRCode(doc, qrData);
      
      // إضافة تذييل الفاتورة
      this._addFooter(doc);
      
      // إنهاء المستند
      doc.end();
      
      // انتظار انتهاء الكتابة
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(invoicePath));
        writeStream.on('error', reject);
      });
    } catch (error) {
      console.error('خطأ في إنشاء الفاتورة:', error);
      throw new Error(`فشل إنشاء الفاتورة: ${error.message}`);
    }
  }
  
  /**
   * إضافة ترويسة الفاتورة
   * @param {PDFDocument} doc - مستند PDF
   * @param {string} invoiceId - معرف الفاتورة
   * @param {string} date - تاريخ الفاتورة
   * @param {string} time - وقت الفاتورة
   * @param {string} tableId - معرف الطاولة (اختياري)
   * @private
   */
  static _addHeader(doc, invoiceId, date, time, tableId) {
    // شعار الكافيه (يمكن استبداله بشعار حقيقي)
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('كافيه سندس', { align: 'center' })
       .moveDown(0.5);
    
    // عنوان الفاتورة
    doc.fontSize(18)
       .font('Helvetica')
       .text('فاتورة', { align: 'center' })
       .moveDown(0.5);
    
    // معلومات الفاتورة
    doc.fontSize(12)
       .text(`رقم الفاتورة: ${invoiceId}`, { align: 'right' })
       .text(`التاريخ: ${date}`, { align: 'right' })
       .text(`الوقت: ${time}`, { align: 'right' });
    
    // إضافة معرف الطاولة إذا كان متوفرًا
    if (tableId) {
      doc.text(`رقم الطاولة: ${tableId}`, { align: 'right' });
    }
    
    doc.moveDown(1);
  }
  
  /**
   * إضافة معلومات العميل
   * @param {PDFDocument} doc - مستند PDF
   * @param {object} customer - معلومات العميل
   * @private
   */
  static _addCustomerInfo(doc, customer) {
    if (customer && (customer.name || customer.phone)) {
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('معلومات العميل:', { align: 'right' })
         .font('Helvetica');
      
      if (customer.name) {
        doc.text(`الاسم: ${customer.name}`, { align: 'right' });
      }
      
      if (customer.phone) {
        doc.text(`الهاتف: ${customer.phone}`, { align: 'right' });
      }
      
      doc.moveDown(1);
    }
  }
  
  /**
   * إضافة جدول العناصر
   * @param {PDFDocument} doc - مستند PDF
   * @param {Array} items - عناصر الفاتورة
   * @private
   */
  static _addItemsTable(doc, items) {
    // عناوين الجدول
    const tableTop = doc.y;
    const itemX = 50;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 400;
    const amountX = 450;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('الرقم', itemX, tableTop, { width: 50, align: 'center' })
       .text('الوصف', descriptionX, tableTop, { width: 200, align: 'right' })
       .text('الكمية', quantityX, tableTop, { width: 50, align: 'center' })
       .text('السعر', priceX, tableTop, { width: 50, align: 'center' })
       .text('المبلغ', amountX, tableTop, { width: 50, align: 'center' })
       .moveDown();
    
    // رسم خط أفقي
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    
    // إضافة العناصر
    doc.font('Helvetica');
    let i = 0;
    items.forEach(item => {
      i++;
      const y = doc.y;
      const amount = item.price * item.quantity;
      
      doc.text(i.toString(), itemX, y, { width: 50, align: 'center' })
         .text(item.description, descriptionX, y, { width: 200, align: 'right' })
         .text(item.quantity.toString(), quantityX, y, { width: 50, align: 'center' })
         .text(item.price.toFixed(2), priceX, y, { width: 50, align: 'center' })
         .text(amount.toFixed(2), amountX, y, { width: 50, align: 'center' })
         .moveDown();
    });
    
    // رسم خط أفقي
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown();
  }
  
  /**
   * إضافة ملخص المجموع
   * @param {PDFDocument} doc - مستند PDF
   * @param {number} subtotal - المجموع الفرعي
   * @param {number} taxRate - نسبة الضريبة
   * @param {number} taxAmount - مبلغ الضريبة
   * @param {number} total - المجموع الكلي
   * @private
   */
  static _addTotalSummary(doc, subtotal, taxRate, taxAmount, total) {
    const summaryX = 400;
    const valueX = 500;
    
    doc.fontSize(12)
       .font('Helvetica')
       .text('المجموع الفرعي:', summaryX, doc.y, { width: 100, align: 'right' })
       .text(subtotal.toFixed(2), valueX, doc.y - 12, { width: 50, align: 'center' })
       .moveDown(0.5)
       .text(`الضريبة (${taxRate}%):`, summaryX, doc.y, { width: 100, align: 'right' })
       .text(taxAmount.toFixed(2), valueX, doc.y - 12, { width: 50, align: 'center' })
       .moveDown(0.5);
    
    // رسم خط أفقي
    doc.moveTo(400, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    
    // المجموع الكلي
    doc.font('Helvetica-Bold')
       .text('المجموع الكلي:', summaryX, doc.y, { width: 100, align: 'right' })
       .text(total.toFixed(2), valueX, doc.y - 12, { width: 50, align: 'center' })
       .moveDown(1);
  }
  
  /**
   * إضافة رمز QR
   * @param {PDFDocument} doc - مستند PDF
   * @param {string} qrData - بيانات رمز QR بتنسيق Base64
   * @private
   */
  static async _addQRCode(doc, qrData) {
    // إضافة عنوان لرمز QR
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('امسح رمز QR للطلب عبر الإنترنت', { align: 'center' })
       .moveDown(0.5);
    
    // استخراج بيانات الصورة من Base64
    const qrImage = qrData.split(';base64,').pop();
    
    // إضافة رمز QR
    const qrSize = 200; // زيادة حجم رمز QR
    const qrX = (doc.page.width - qrSize) / 2;
    
    // التأكد من وجود بيانات صورة صالحة
    if (qrImage) {
      try {
        doc.image(Buffer.from(qrImage, 'base64'), qrX, doc.y, {
          width: qrSize,
          height: qrSize
        });
        console.log('تم إضافة رمز QR بنجاح');
      } catch (error) {
        console.error('خطأ في إضافة رمز QR:', error);
        doc.text('حدث خطأ في إضافة رمز QR', { align: 'center' });
      }
    } else {
      console.error('بيانات رمز QR غير صالحة');
      doc.text('بيانات رمز QR غير صالحة', { align: 'center' });
    }
    
    doc.moveDown(qrSize / 12 + 2);
  }
  
  /**
   * إضافة تذييل الفاتورة
   * @param {PDFDocument} doc - مستند PDF
   * @private
   */
  static _addFooter(doc) {
    // رسم خط أفقي
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    
    // إضافة نص التذييل
    doc.fontSize(10)
       .font('Helvetica')
       .text('شكرًا لزيارتكم كافيه سندس', { align: 'center' })
       .text('نتطلع لرؤيتكم مرة أخرى', { align: 'center' })
       .moveDown(0.5);
  }
}

module.exports = InvoiceService;