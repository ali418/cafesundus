# إعداد Cloudinary لتخزين الصور

## المشكلة
كانت صور المنتجات تُحذف كل مرة يتم إعادة نشر التطبيق على Railway لأنها كانت تُخزن محلياً في مجلد `uploads`.

## الحل
تم تطبيق نظام تخزين سحابي باستخدام Cloudinary مع إبقاء التخزين المحلي كخيار احتياطي.

## خطوات الإعداد

### 1. إنشاء حساب Cloudinary
1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. أنشئ حساب مجاني
3. احصل على بيانات الاعتماد من Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. إعداد متغيرات البيئة
أضف المتغيرات التالية إلى ملف `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. إعداد Railway
في Railway Dashboard:
1. اذهب إلى Variables
2. أضف المتغيرات الثلاثة بقيمها الصحيحة

## كيف يعمل النظام

### رفع الصور
- يحاول النظام رفع الصورة إلى Cloudinary أولاً
- إذا فشل، يستخدم التخزين المحلي كخيار احتياطي
- الصور المرفوعة إلى Cloudinary تُحفظ في مجلد `cafe-sundus/products`

### عرض الصور
- النظام يتعرف تلقائياً على روابط Cloudinary
- يدعم أيضاً الصور المحلية للتوافق مع الصور القديمة

### حذف الصور
- الصور في Cloudinary تُحذف باستخدام public_id
- الصور المحلية تُحذف من مجلد uploads

## الملفات المُحدثة

### Backend
- `src/config/cloudinary.js` - إعداد Cloudinary
- `src/controllers/upload.controller.js` - تحديث آلية الرفع والحذف
- `.env.example` - إضافة متغيرات Cloudinary
- `package.json` - إضافة مكتبة cloudinary

### Frontend
- `src/pages/products/Products.jsx` - تحديث عرض الصور
- `src/pages/online/OnlineOrder.jsx` - تحديث عرض الصور
- `src/pages/sales/POS.jsx` - تحديث عرض الصور

## المزايا
1. **الثبات**: الصور لا تُحذف عند إعادة النشر
2. **الأداء**: تحسين سرعة تحميل الصور
3. **التوافق**: يدعم الصور القديمة والجديدة
4. **الأمان**: نسخ احتياطي تلقائي في التخزين المحلي

## الاستخدام
بعد الإعداد، النظام سيعمل تلقائياً:
- رفع صور جديدة → Cloudinary
- عرض الصور → يدعم جميع الأنواع
- حذف الصور → يحذف من المصدر الصحيح

## ملاحظات مهمة
- تأكد من إعداد متغيرات البيئة بشكل صحيح
- الحساب المجاني في Cloudinary يدعم حتى 25GB تخزين
- النظام يحتفظ بالتوافق مع الصور المحلية الموجودة