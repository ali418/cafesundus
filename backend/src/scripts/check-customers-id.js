// سكريبت للتحقق من حالة عمود customers.id في قاعدة البيانات
// يمكن تشغيله للتحقق من نجاح الإصلاح

require('dotenv').config();
const { Pool } = require('pg');

// إنشاء اتصال بقاعدة البيانات
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCustomersIdColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 جاري فحص جدول العملاء...');
    
    // التحقق من وجود جدول customers
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ جدول العملاء غير موجود!');
      return;
    }
    
    // التحقق من حالة عمود id
    const columnCheck = await client.query(`
      SELECT is_identity, column_default, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'customers' 
      AND column_name = 'id';
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ عمود id غير موجود في جدول العملاء!');
      return;
    }
    
    const isIdentity = columnCheck.rows[0].is_identity === 'YES';
    const hasSequence = columnCheck.rows[0].column_default && 
                        columnCheck.rows[0].column_default.includes('nextval');
    const dataType = columnCheck.rows[0].data_type;
    
    console.log('معلومات عمود id:');
    console.log(`- نوع البيانات: ${dataType}`);
    console.log(`- is_identity: ${isIdentity ? 'YES' : 'NO'}`);
    console.log(`- column_default: ${columnCheck.rows[0].column_default || 'NULL'}`);
    console.log(`- has_sequence: ${hasSequence ? 'YES' : 'NO'}`);
    
    if (isIdentity) {
      console.log('✅ عمود id مهيأ كـ IDENTITY');
    } else if (hasSequence) {
      console.log('✅ عمود id مهيأ باستخدام sequence');
    } else {
      console.log('❌ عمود id غير مهيأ للتوليد التلقائي!');
    }
    
    // التحقق من وجود بيانات في الجدول
    const countCheck = await client.query(`
      SELECT COUNT(*) FROM customers;
    `);
    
    console.log(`عدد العملاء في الجدول: ${countCheck.rows[0].count}`);
    
    // التحقق من آخر قيمة id
    if (parseInt(countCheck.rows[0].count) > 0) {
      const maxIdCheck = await client.query(`
        SELECT MAX(id) FROM customers;
      `);
      
      console.log(`أعلى قيمة id: ${maxIdCheck.rows[0].max}`);
    }
    
  } catch (err) {
    console.error('❌ خطأ في قاعدة البيانات:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

// تنفيذ الوظيفة
checkCustomersIdColumn()
  .then(() => {
    console.log('🏁 اكتمل فحص عمود id');
  })
  .catch(err => {
    console.error('❌ خطأ غير متوقع:', err);
    process.exit(1);
  });