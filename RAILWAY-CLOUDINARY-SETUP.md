# دليل إعداد Cloudinary في Railway

## المشكلة
عند نشر التطبيق على Railway، يتم حذف الصور المرفوعة محلياً لأن Railway يستخدم نظام ملفات مؤقت (ephemeral storage). هذا يعني أن جميع الملفات المرفوعة تُحذف عند إعادة النشر.

## الحل
استخدام Cloudinary كخدمة تخزين سحابي للصور.

## خطوات الإعداد

### 1. إنشاء حساب Cloudinary
1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. أنشئ حساب مجاني
3. بعد التسجيل، ستحصل على:
   - Cloud Name
   - API Key
   - API Secret

### 2. إعداد متغيرات البيئة في Railway

#### الطريقة الأولى: من لوحة التحكم
1. اذهب إلى مشروعك في Railway
2. اختر خدمة Backend
3. اذهب إلى تبويب "Variables"
4. أضف المتغيرات التالية:

```
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

#### الطريقة الثانية: من سطر الأوامر
```bash
railway variables set CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
railway variables set CLOUDINARY_API_KEY=your_actual_api_key
railway variables set CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 3. التحقق من الإعدادات المحلية
تأكد من أن ملف `.env` يحتوي على:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. إعادة النشر
بعد إضافة المتغيرات، أعد نشر التطبيق:
```bash
git add .
git commit -m "Add Cloudinary environment variables"
git push origin master
```

## كيف يعمل النظام

### رفع الصور
1. **محلياً**: إذا كانت متغيرات Cloudinary موجودة، سيتم الرفع إلى Cloudinary
2. **في Railway**: سيتم الرفع إلى Cloudinary تلقائياً
3. **Fallback**: إذا فشل Cloudinary، سيتم الرفع محلياً (مؤقتاً)

### عرض الصور
- الصور من Cloudinary: تُعرض مباشرة من URL الخاص بـ Cloudinary
- الصور المحلية: تُعرض من مجلد uploads

### حذف الصور
- الصور في Cloudinary: تُحذف باستخدام public_id
- الصور المحلية: تُحذف من مجلد uploads

## التحقق من نجاح الإعداد

### 1. فحص Logs في Railway
```bash
railway logs
```
ابحث عن رسائل مثل:
- "Cloudinary upload successful"
- "Image uploaded to Cloudinary"

### 2. اختبار رفع صورة
1. ارفع صورة منتج جديد
2. تحقق من أن URL الصورة يحتوي على `cloudinary.com`
3. تأكد من أن الصورة تظهر بعد إعادة النشر

## استكشاف الأخطاء

### خطأ: "Cloudinary upload failed"
- تحقق من صحة متغيرات البيئة
- تأكد من أن API Key و Secret صحيحان
- تحقق من حدود الحساب المجاني

### خطأ: "Invalid cloud name"
- تأكد من أن CLOUDINARY_CLOUD_NAME صحيح
- لا تضع مسافات أو أحرف خاصة

### الصور لا تظهر
- تحقق من أن URL الصورة صحيح
- تأكد من أن الصورة موجودة في Cloudinary Dashboard

## معلومات إضافية

### حدود الحساب المجاني
- 25 GB تخزين
- 25 GB bandwidth شهرياً
- 1000 تحويل شهرياً

### أمان البيانات
- لا تشارك API Secret مع أحد
- استخدم متغيرات البيئة فقط
- لا تضع المفاتيح في الكود مباشرة

## الدعم
إذا واجهت مشاكل:
1. تحقق من Railway logs
2. راجع Cloudinary Dashboard
3. تأكد من صحة جميع المتغيرات