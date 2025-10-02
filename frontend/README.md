# واجهة المستخدم لنظام إدارة المبيعات والمخزون للبقالة

هذا المشروع هو الواجهة الأمامية لنظام إدارة المبيعات والمخزون للبقالات، مبني باستخدام React وMaterial-UI مع دعم كامل للغة العربية والإنجليزية.

## المميزات

- واجهة مستخدم سهلة الاستخدام ومتجاوبة
- دعم متعدد اللغات (العربية والإنجليزية) مع تبديل سلس بينهما
- تغيير اتجاه الصفحة تلقائيًا (RTL/LTR) حسب اللغة
- تحميل الخطوط المناسبة لكل لغة (Tajawal للعربية)
- نظام نقاط البيع (POS) متكامل
- إدارة المنتجات والفئات والعملاء
- لوحة تحكم مع إحصائيات ورسوم بيانية

## متطلبات التشغيل

- Node.js (الإصدار 18.16.0 أو أحدث)
- npm أو yarn

## تثبيت وتشغيل المشروع

```bash
# تثبيت التبعيات
npm install

# تشغيل خادم التطوير
npm start
```

## نظام الترجمة (i18next)

يستخدم المشروع مكتبة i18next للترجمة مع دعم تحميل ملفات الترجمة بشكل ديناميكي من الخادم.

### هيكل ملفات الترجمة

توجد ملفات الترجمة في المجلد `/public/locales/` مقسمة حسب اللغة والوحدات الوظيفية:

```
/public/locales/
  ├── ar/                # الترجمات العربية
  │   ├── common.json    # الترجمات المشتركة
  │   ├── auth.json      # ترجمات صفحات المصادقة
  │   ├── dashboard.json # ترجمات لوحة التحكم
  │   └── ...
  └── en/                # الترجمات الإنجليزية
      ├── common.json
      ├── auth.json
      └── ...
```

### استخدام React Suspense مع i18next

لتجنب مشكلة "race condition" عند تحميل الترجمات، يستخدم المشروع React Suspense لتأخير عرض المكونات حتى يتم تحميل الترجمات بالكامل:

1. **تكوين i18next مع Suspense**:

```javascript
// src/i18n/i18n.js
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // ... إعدادات أخرى
    react: {
      useSuspense: true, // تمكين استخدام Suspense
    },
  });
```

2. **تغليف التطبيق بمكون Suspense**:

```javascript
// src/index.js
import React, { Suspense } from 'react';

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Suspense fallback={<div>جاري تحميل الترجمات...</div>}>
          <App />
        </Suspense>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
```

3. **استخدام وعود (Promises) عند تغيير اللغة**:

```javascript
// عند تغيير اللغة
i18n.changeLanguage(newLanguage)
  .then(() => {
    console.log(`تم تغيير اللغة إلى ${newLanguage} وتحميل الترجمات بنجاح`);
  })
  .catch(error => {
    console.error(`خطأ في تغيير اللغة:`, error);
  });
```

### حل مشكلة "Race Condition" في تحميل الترجمات

إذا واجهت رسائل خطأ مثل:

```
You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!
```

فهذا يعني أن المكونات تحاول استخدام وظيفة الترجمة `t` قبل أن يكتمل تحميل الترجمات. الحل هو:

1. التأكد من تمكين `useSuspense: true` في إعدادات i18next
2. تغليف التطبيق أو المكونات التي تستخدم الترجمات بمكون `<Suspense>`
3. استخدام الوعود (Promises) التي تعيدها وظائف مثل `i18n.changeLanguage()` و `i18n.loadNamespaces()`

## إعادة تحميل الترجمات يدويًا

في وضع التطوير، يمكنك استخدام زر "إعادة تحميل الترجمات" الموجود في مكون تبديل اللغة لإعادة تحميل جميع ملفات الترجمة يدويًا إذا واجهت أي مشاكل.

## المساهمة

نرحب بمساهماتكم! يرجى الاطلاع على [دليل المساهمة](../CONTRIBUTING.md) للحصول على مزيد من المعلومات.