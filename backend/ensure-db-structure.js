const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration
const config = {
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
};

async function ensureDbStructure() {
  let sequelize;
  
  try {
    console.log('🔍 Checking database structure...');
    
    // Create Sequelize instance
    if (process.env.DATABASE_URL) {
      sequelize = new Sequelize(process.env.DATABASE_URL, config.production);
    } else {
      throw new Error('DATABASE_URL not found');
    }
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if users table exists and has correct structure
    const [results] = await sequelize.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    if (results.length === 0) {
      console.log('⚠️  Users table does not exist, running migrations...');
      await runMigrations(sequelize);
    } else {
      // Check if id column is UUID
      const idColumn = results.find(col => col.column_name === 'id');
      if (idColumn && idColumn.data_type !== 'uuid') {
        console.log('⚠️  Users table has incorrect id type, fixing...');
        await fixUsersTable(sequelize);
      } else {
        console.log('✅ Users table structure is correct');
      }
    }
    
    // Ensure other required columns exist
    await ensureRequiredColumns(sequelize);
    
    console.log('✅ Database structure verification complete');
    
  } catch (error) {
    console.error('❌ Database structure check failed:', error.message);
    throw error;
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
}

async function runMigrations(sequelize) {
  try {
    console.log('🔄 Running database migrations...');
    
    // Create users table with correct structure
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
    `);
    
    console.log('✅ Users table created successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function fixUsersTable(sequelize) {
  try {
    console.log('🔄 Converting users table to UUID...');
    
    // Check if table has data
    const [dataCheck] = await sequelize.query('SELECT COUNT(*) as count FROM users');
    const hasData = parseInt(dataCheck[0].count) > 0;
    
    if (hasData) {
      console.log('⚠️  Users table has data, performing safe conversion...');
      
      // Create backup
      await sequelize.query('CREATE TABLE users_backup AS SELECT * FROM users');
      
      // Drop and recreate
      await sequelize.query('DROP TABLE users CASCADE');
      
      await sequelize.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          phone VARCHAR(255),
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMP
        );
      `);
      
      // Insert data back
      await sequelize.query(`
        INSERT INTO users (username, email, password, full_name, phone, role, is_active, last_login, created_at, updated_at, deleted_at)
        SELECT username, email, password, full_name, phone, role, is_active, last_login, created_at, updated_at, deleted_at
        FROM users_backup
      `);
      
      // Drop backup
      await sequelize.query('DROP TABLE users_backup');
      
      console.log('✅ Users table converted with data preserved');
    } else {
      console.log('ℹ️  Users table is empty, performing simple conversion...');
      
      await sequelize.query('ALTER TABLE users DROP COLUMN id');
      await sequelize.query('ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      
      console.log('✅ Empty users table converted successfully');
    }
  } catch (error) {
    console.error('❌ Users table conversion failed:', error.message);
    throw error;
  }
}

async function ensureRequiredColumns(sequelize) {
  try {
    // Check and add missing columns
    const requiredColumns = [
      { name: 'full_name', type: 'VARCHAR(255)' },
      { name: 'phone', type: 'VARCHAR(255)' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true' },
      { name: 'last_login', type: 'TIMESTAMP' },
      { name: 'deleted_at', type: 'TIMESTAMP' }
    ];
    
    for (const column of requiredColumns) {
      try {
        await sequelize.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
      } catch (error) {
        // Column might already exist, ignore error
        console.log(`Column ${column.name} already exists or error:`, error.message);
      }
    }
    
    console.log('✅ Required columns verified');
  } catch (error) {
    console.error('❌ Column verification failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  ensureDbStructure()
    .then(() => {
      console.log('🎉 Database structure setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database structure setup failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureDbStructure };