require('dotenv').config({ override: true });
const crypto = require('crypto');

// Ensure JWT secrets are present to avoid runtime errors in auth
(() => {
  const isProd = process.env.NODE_ENV === 'production';

  if (!process.env.JWT_SECRET) {
    const fallback = crypto.randomBytes(32).toString('hex');
    process.env.JWT_SECRET = fallback;
    console.error(
      '[WARN] JWT_SECRET is missing. A temporary secret was generated.\n' +
      '       Set a persistent `JWT_SECRET` in your environment (Railway → Variables).'
    );
    if (isProd) {
      console.error('       Using a generated secret in production is NOT recommended.');
    }
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    const fallbackRefresh = crypto.randomBytes(32).toString('hex');
    process.env.JWT_REFRESH_SECRET = fallbackRefresh;
    console.error(
      '[WARN] JWT_REFRESH_SECRET is missing. A temporary secret was generated.\n' +
      '       Set a persistent `JWT_REFRESH_SECRET` in your environment (Railway → Variables).'
    );
    if (isProd) {
      console.error('       Using a generated refresh secret in production is NOT recommended.');
    }
  }
})();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const path = require('path');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const fs = require('fs');

// Initialize database
const db = require('./models');

// Initialize express app
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
// Improve CORS to accept multiple origins from env (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://cafesundus.up.railway.app,https://cafesundus-production.up.railway.app')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

// During development, allow all origins
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
} else {
  // In production, use the configured origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin like curl/postman or same-origin
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        console.log('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );
}
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 }, // 5MB default
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Do not count health checks towards the limit
  skip: (req) => req.path === '/api/v1/health' || req.path === '/health' || req.path === '/api/health',
});

if (isProduction) {
  app.use(limiter);
} else {
  console.log('Rate limiter disabled in development');
}

// ✅ Railway health check endpoint (must be at /api/health)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Set up routes
// استخدام مسار واحد فقط لتجنب التداخل
app.use('/api/v1', routes);

// Note: /online-order route is handled by the frontend React app
// The online order functionality is implemented as a React component
// Remove the backend route to allow frontend routing to work properly

// Serve frontend build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server
// Use PORT environment variable for Railway compatibility
const PORT = Number(process.env.PORT || 3000);

(async () => {
  try {
    console.log('Attempting to connect to database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Available' : 'Not available');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    
    // If in production and DATABASE_URL is not available, try to use Railway's default
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      console.error('❌ DATABASE_URL not found in production environment!');
      console.error('🔧 To fix this:');
      console.error('   1. Go to your Railway project dashboard');
      console.error('   2. Navigate to Settings → Variables');
      console.error('   3. Add DATABASE_URL environment variable');
      console.error('   4. Use value: postgresql://postgres:CzZNBTInqfVEkHFZmTvwaAeNctJVObVU@postgres.railway.internal:5432/railway');
      throw new Error('DATABASE_URL is required for production deployment - see logs above for setup instructions');
    }
    
    await db.sequelize.authenticate();

    // Create settings table if it doesn't exist
    try {
      // First check if the settings table exists
      const [tableExists] = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings');"
      );
      
      if (!tableExists[0].exists) {
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            store_name VARCHAR(255) NOT NULL DEFAULT 'My Store',
            currency_code VARCHAR(10) NOT NULL DEFAULT 'UGX',
            currency_symbol VARCHAR(10) NOT NULL DEFAULT 'USh',
            email VARCHAR(255),
            phone VARCHAR(255),
            address VARCHAR(255),
            city VARCHAR(255),
            state VARCHAR(255),
            postal_code VARCHAR(255),
            country VARCHAR(255),
            website VARCHAR(255),
            tax_rate DECIMAL(10,2) DEFAULT 0,
            logo_url VARCHAR(255),
            language VARCHAR(50) DEFAULT 'en',
            invoice_prefix VARCHAR(50),
            invoice_suffix VARCHAR(50),
            invoice_next_number INTEGER DEFAULT 1,
            invoice_show_logo BOOLEAN DEFAULT true,
            invoice_show_tax_number BOOLEAN DEFAULT true,
            invoice_show_signature BOOLEAN DEFAULT true,
            invoice_footer_text TEXT,
            invoice_terms_and_conditions TEXT,
            receipt_show_logo BOOLEAN DEFAULT true,
            receipt_show_tax_details BOOLEAN DEFAULT true,
            receipt_print_automatically BOOLEAN DEFAULT false,
            receipt_footer_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Insert default settings record
        await db.sequelize.query(`
          INSERT INTO settings (store_name, currency_code, currency_symbol, language)
          VALUES ('Cafe Sundus', 'UGX', 'USh', 'ar');
        `);
        
        console.log('Settings table created and initialized with default values');
      } else {
        console.log('Settings table already exists');
      }
    } catch (err) {
      console.error('Error creating settings table:', err);
    }

    // Check if products table exists before trying to alter it
    const [productsTableExists] = await db.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products');"
    );
    
    if (productsTableExists[0].exists) {
      // Ensure products.image_url column exists
      const [results] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url';"
      );
      if (!results || results.length === 0) {
        await db.sequelize.query('ALTER TABLE "products" ADD COLUMN "image_url" VARCHAR(255);');
        console.log('Added image_url column to products table');
      }

      // Ensure products.barcode column exists
      const [barcodeRes] = await db.sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'barcode';"
      );
      if (!barcodeRes || barcodeRes.length === 0) {
        await db.sequelize.query('ALTER TABLE "products" ADD COLUMN "barcode" VARCHAR(50);');
        console.log('Added barcode column to products table');
      }
    } else {
      console.log('Products table does not exist yet, skipping column alterations');
    }

    // Check if inventory_transactions table exists before trying to alter it
    try {
      const [invTxTableExists] = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_transactions');"
      );
      
      if (invTxTableExists[0].exists) {
        // Ensure inventory_transactions.inventory_id is INTEGER (not UUID)
        const [invTxCol] = await db.sequelize.query(
          "SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory_transactions' AND column_name = 'inventory_id';"
        );
        const colType = invTxCol && invTxCol[0] && (invTxCol[0].data_type || '').toLowerCase();
        if (colType && colType.includes('uuid')) {
          console.log('Fixing inventory_transactions.inventory_id type from UUID to INTEGER...');
          // Drop FK if exists
          try {
            await db.sequelize.query('ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_inventory_id_fkey";');
          } catch (e) {}
          // Change column type using safe cast (table is typically empty or contains numeric-like uuids)
          await db.sequelize.query('ALTER TABLE "inventory_transactions" ALTER COLUMN "inventory_id" TYPE INTEGER USING (CAST("inventory_id"::text AS INTEGER));');
          // Re-add FK
          await db.sequelize.query('ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON UPDATE CASCADE ON DELETE RESTRICT;');
          console.log('inventory_transactions.inventory_id type fixed to INTEGER.');
        }
      } else {
        console.log('Inventory_transactions table does not exist yet, skipping column alterations');
      }
    } catch (e) {
      console.warn('Warning: Could not verify/fix inventory_transactions.inventory_id type:', e.message || e);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
})();

module.exports = app; // For testing purposes