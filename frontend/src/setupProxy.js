// This file is used to configure the development server
// It will be automatically picked up by react-scripts

const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

// محاولة قراءة ملف التكوين إذا كان موجودًا
// استخدام المنفذ 3005 للخادم الخلفي (تم تغييره من 3003 إلى 3005)
let BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3005';

// محاولة استيراد ملف التكوين بطريقة متوافقة مع Node.js
try {
  // قراءة ملف التكوين كنص
  const configPath = path.resolve(__dirname, 'config', 'networkConfig.js');
  if (fs.existsSync(configPath) && !process.env.REACT_APP_BACKEND_URL) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    // استخراج قيمة BACKEND_URL من النص
    const match = configContent.match(/BACKEND_URL\s*=\s*['"`](.*?)['"`]/i);
    if (match && match[1]) {
      BACKEND_URL = match[1];
      console.log('تم استخدام عنوان الخادم الخلفي من ملف التكوين:', BACKEND_URL);
    }
  }
} catch (error) {
  console.error('خطأ في قراءة ملف التكوين:', error.message);
  console.log('استخدام عنوان الخادم الخلفي من متغيرات البيئة:', BACKEND_URL);
}

module.exports = function (app) {
  // تعطيل محاولات WebSocket لتجنب أخطاء الاتصال أثناء التطوير
  app.use(function (req, res, next) {
    res.setHeader('X-No-WebSocket', 'true');
    next();
  });

  // Proxy API requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      timeout: 60000, // Increase timeout to 60 seconds
      proxyTimeout: 60000, // Increase proxy timeout to 60 seconds
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'text/plain',
        });
        res.end('خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الشبكة أو إعدادات الخادم.');
      },
    })
  );

  // Proxy uploads requests to backend
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
    })
  );

  // Proxy /online-order to frontend so it serves the React component
  app.use(
    '/online-order',
    (req, res, next) => {
      // Forward to React router instead of proxying to backend
      req.url = '/';
      next();
    }
  );
};