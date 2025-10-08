const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// تأكيد تشغيل السكريبت ببيئة التطوير لتعطيل SSL في الاتصال المحلي
process.env.NODE_ENV = 'development';

// تحميل إعدادات البيئة: إن لم تكن DATABASE_URL موجودة نقرأها من .env.production
(() => {
  if (!process.env.DATABASE_URL) {
    try {
      const envPath = path.join(__dirname, '.env.production');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const kv = {};
        content.split('\n').forEach(line => {
          const [key, ...rest] = line.split('=');
          if (!key || !rest.length) return;
          const value = rest.join('=').trim();
          kv[key.trim()] = value;
        });
        if (!process.env.DATABASE_URL && kv.DATABASE_URL) {
          process.env.DATABASE_URL = kv.DATABASE_URL;
        }
        if (!process.env.NODE_ENV && kv.NODE_ENV) {
          process.env.NODE_ENV = kv.NODE_ENV;
        }
        if (!process.env.DATABASE_URL) {
          let host = kv.DB_HOST || 'localhost';
          if (host === 'postgres') host = 'localhost';
          const port = kv.DB_PORT || '5432';
          const name = kv.DB_NAME || 'postgres';
          const user = kv.DB_USER || 'postgres';
          const pass = kv.DB_PASSWORD || '';
          process.env.DATABASE_URL = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${name}`;
        }
      }
    } catch (e) {
      // تجاهل أخطاء القراءة
    }
  }
})();

// إنشاء اتصال سيكوالايز مستقل وتعريف نموذج User فقط لتجنب مزامنة جميع النماذج
const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});
const defineUser = require('./src/models/user');
const User = defineUser(sequelize, Sequelize.DataTypes);

async function ensureAdmin() {
  try {
    await sequelize.authenticate();

    const username = 'admin';
    const rawPassword = 'aliali!@#';
    const hashed = await bcrypt.hash(rawPassword, 12);

    // محاولة التحديث أولاً باستخدام استعلامات SQL مباشرة لتفادي اختلاف أسماء الأعمدة
    const [updateResult, updateMeta] = await sequelize.query(
      'UPDATE users SET password = :password, is_active = TRUE WHERE username = :username',
      { replacements: { password: hashed, username } }
    );

    const updatedRows = Array.isArray(updateMeta) ? updateMeta[1] : (updateMeta && updateMeta.rowCount) || 0;
    if (updatedRows && updatedRows > 0) {
      console.log('✅ تم تحديث كلمة مرور مستخدم admin وتفعيله');
    } else {
      const { v4: uuidv4 } = require('uuid');
      await sequelize.query(
        'INSERT INTO users (id, username, email, password, full_name, role, is_active) VALUES (:id, :username, :email, :password, :full_name, :role, TRUE)',
        {
          replacements: {
            id: uuidv4(),
            username,
            email: 'admin@example.com',
            password: hashed,
            full_name: 'Admin',
            role: 'admin',
          }
        }
      );
      console.log('✅ تم إنشاء مستخدم admin جديد');
    }

    console.log('يمكنك الآن تسجيل الدخول بالبيانات التالية:');
    console.log('username: admin');
    console.log('password: aliali!@#');
  } catch (error) {
    console.error('❌ خطأ أثناء إعداد المستخدم admin:', error);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch (_) {}
  }
}

ensureAdmin();