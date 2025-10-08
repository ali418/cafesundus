// سكريبت لإعادة تعيين كلمة مرور المستخدم admin أو إنشاء مستخدم جديد
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// قراءة ملف .env.production
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');

// استخراج معلومات قاعدة البيانات من ملف .env
const dbConfig = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    dbConfig[key.trim()] = value.trim();
  }
});

// إعداد اتصال قاعدة البيانات
const sequelize = new Sequelize(
  dbConfig.DB_NAME || 'cafe_sundus',
  dbConfig.DB_USER || 'root',
  dbConfig.DB_PASSWORD || '',
  {
    host: dbConfig.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function resetAdminPassword() {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // تشفير كلمة المرور الجديدة
    const hashedPassword = bcrypt.hashSync('aliali!@#', 10);
    
    // التحقق من وجود المستخدم admin
    const [results] = await sequelize.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );

    if (results.length > 0) {
      // تحديث كلمة المرور للمستخدم الموجود
      await sequelize.query(
        "UPDATE users SET password = ? WHERE username = 'admin'",
        {
          replacements: [hashedPassword]
        }
      );
      console.log('تم تحديث كلمة المرور للمستخدم admin بنجاح');
    } else {
      // إنشاء مستخدم جديد
      await sequelize.query(
        "INSERT INTO users (username, password, name, role, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
        {
          replacements: ['admin', hashedPassword, 'المسؤول', 'admin', 'admin@example.com']
        }
      );
      console.log('تم إنشاء مستخدم admin جديد بنجاح');
    }

    console.log('يمكنك الآن تسجيل الدخول باستخدام:');
    console.log('اسم المستخدم: admin');
    console.log('كلمة المرور: aliali!@#');

  } catch (error) {
    console.error('حدث خطأ:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();