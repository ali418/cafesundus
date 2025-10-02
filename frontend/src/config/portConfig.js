/**
 * ملف تكوين المنافذ
 * يحتوي على إعدادات المنافذ المستخدمة في التطبيق
 * قم بتعديل هذا الملف عند الحاجة لتغيير المنافذ
 */

// منفذ موحد للواجهة الأمامية والخلفية
export const UNIFIED_PORT = '3000';

// منفذ الواجهة الأمامية (للتوافق مع الكود القديم)
export const FRONTEND_PORT = UNIFIED_PORT;

// منفذ الخادم الخلفي (للتوافق مع الكود القديم)
export const BACKEND_PORT = UNIFIED_PORT;

// تصدير المنافذ كمصفوفة للاستخدام في أماكن أخرى
export const PORTS = {
  FRONTEND: FRONTEND_PORT,
  BACKEND: BACKEND_PORT
};