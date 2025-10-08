const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Database configuration
let sequelize;

// Use DATABASE_URL for connection
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for database connection');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
  
  sequelize.authenticate()
    .then(() => console.log("✅ Connected to PostgreSQL successfully"))
    .catch(err => console.error("❌ Database connection error:", err));
    
} else {
  // Fallback for local development
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
    }
  };

  // Initialize Sequelize
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
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