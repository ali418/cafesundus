/**
 * ملف تكوين الشبكة
 * يحتوي على إعدادات الشبكة المستخدمة في التطبيق
 * قم بتعديل هذا الملف عند تغيير شبكة الواي فاي
 */

import { UNIFIED_PORT } from './portConfig';

// عنوان IP الحالي للخادم
export const SERVER_IP = '192.168.100.68';

// عنوان URL الكامل للخادم الموحد
export const UNIFIED_URL = `http://${SERVER_IP}:${UNIFIED_PORT}`;

// عنوان URL الكامل للواجهة الأمامية (للتوافق مع الكود القديم)
export const FRONTEND_URL = UNIFIED_URL;

// عنوان URL الكامل للخادم الخلفي (للتوافق مع الكود القديم)
export const BACKEND_URL = UNIFIED_URL;

// عنوان URL لصفحة الطلبات عبر الإنترنت
export const ONLINE_ORDER_URL = `${FRONTEND_URL}/online-order`;