const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Also try to load from Railway environment or production
if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
  console.log('Running on Railway/Production, using DATABASE_URL');
  console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
}

// Database configuration
let sequelize;

// Use DATABASE_URL if available, otherwise use individual connection parameters
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for database connection');
  
  // Method 1: Using use_env_variable (Recommended for Railway)
  try {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: env === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
      dialectOptions: {
         useUTC: false,
         ssl: {
           require: true,
           rejectUnauthorized: false,
         },
         protocol: 'postgres',
       },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
    console.log('✅ Sequelize connected using DATABASE_URL directly');
  } catch (error) {
    console.log('⚠️  Direct connection failed, trying URL parsing method');
    
    // Method 2: Parse the DATABASE_URL to extract connection details
    const url = require('url');
    const dbUrl = new URL(process.env.DATABASE_URL);
    
    const config = {
      username: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1), // Remove leading slash
      host: dbUrl.hostname,
      port: dbUrl.port || 5432,
      dialect: 'postgres',
      logging: env === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
      dialectOptions: {
         useUTC: false,
         ssl: {
           require: true,
           rejectUnauthorized: false,
         },
         protocol: 'postgres',
       },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    };
    
    sequelize = new Sequelize(config.database, config.username, config.password, config);
    console.log('✅ Sequelize connected using parsed URL parameters');
  }
} else {
  const config = {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cafe_sundus',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: env === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    dialectOptions: {
      // استخدام مسار PostgreSQL المحدد في ملف .env
      bin: process.env.POSTGRES_PATH
    }
  };

  // Initialize Sequelize
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      dialectOptions: {
        // Fix for notifications table not found
        useUTC: false,
        // استخدام مسار PostgreSQL المحدد في ملف .env
        bin: process.env.PG_BIN_PATH
      }
    }
  );
}

const db = {};

// Load models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Ensure all models are loaded
const modelFiles = [
  'user.js',
  'product.js',
  'category.js',
  'inventory.js',
  'inventoryTransaction.js',
  'sale.js',
  'saleItem.js',
  'customer.js',
  'notification.js',
  'setting.js'
];

// Check if all required models are loaded
modelFiles.forEach(file => {
  const modelName = path.basename(file, '.js');
  // Convert to PascalCase for model name
  const pascalCaseModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  if (!db[pascalCaseModelName]) {
    console.warn(`Warning: Model ${pascalCaseModelName} not loaded. Check if the file exists and is properly defined.`);
  }
});

// Associate models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Sync database models (create tables if they don't exist)
sequelize.sync({ force: false, alter: true }) // Using alter:true to apply changes without dropping tables
  .then(() => {
    console.log('Database synchronized successfully - tables updated');
    
    // Create default settings if they don't exist
    return db.Setting.findOrCreate({
      where: { id: 1 },
      defaults: {
        store_name: 'Cafe Sundus',
        currency_code: 'UGX',
        currency_symbol: 'UGX',
        language: 'ar',
        tax_rate: 15,
        invoice_prefix: 'INV',
        invoice_next_number: 1001
      }
    });
  })
  .then(([setting, created]) => {
    if (created) {
      console.log('Default settings created successfully');
    } else {
      console.log('Default settings already exist');
    }
  })
  .catch(err => {
    console.error('Failed to synchronize database:', err);
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;