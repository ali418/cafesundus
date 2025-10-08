'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Products: add missing columns to align with model
    await queryInterface.sequelize.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_generated_barcode BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description_ar TEXT,
      ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS unit_id INTEGER
    `);

    // Sale Items: add total_price column
    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items
      ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NOT NULL DEFAULT 0
    `);

    // Sales: add missing columns and ensure source enum
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sales_source') THEN
          CREATE TYPE enum_sales_source AS ENUM ('pos', 'online');
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS transaction_image VARCHAR(255),
      ADD COLUMN IF NOT EXISTS delivery_address TEXT,
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS source enum_sales_source NOT NULL DEFAULT 'pos'::enum_sales_source
    `);

    // Categories: add missing columns
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
    `);

    // Settings: add payment and receipt related columns
    await queryInterface.sequelize.query(`
      ALTER TABLE settings
      ADD COLUMN IF NOT EXISTS receipt_show_online_order_qr BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS accept_cash BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS accept_credit_cards BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS accept_debit_cards BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS accept_mobile_payments BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS default_payment_method VARCHAR(20) DEFAULT 'cash',
      ADD COLUMN IF NOT EXISTS mtn_phone_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS airtel_phone_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mobile_pin_digits INTEGER DEFAULT 4
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert Settings additions
    await queryInterface.sequelize.query(`
      ALTER TABLE settings
      DROP COLUMN IF EXISTS mobile_pin_digits,
      DROP COLUMN IF EXISTS airtel_phone_number,
      DROP COLUMN IF EXISTS mtn_phone_number,
      DROP COLUMN IF EXISTS default_payment_method,
      DROP COLUMN IF EXISTS accept_mobile_payments,
      DROP COLUMN IF EXISTS accept_debit_cards,
      DROP COLUMN IF EXISTS accept_credit_cards,
      DROP COLUMN IF EXISTS accept_cash,
      DROP COLUMN IF EXISTS receipt_show_online_order_qr
    `);

    // Revert Categories additions
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      DROP COLUMN IF EXISTS deleted_at,
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS image_url
    `);

    // Revert Sales additions (keep enum type to avoid affecting other dependencies)
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS source,
      DROP COLUMN IF EXISTS customer_email,
      DROP COLUMN IF EXISTS customer_phone,
      DROP COLUMN IF EXISTS customer_name,
      DROP COLUMN IF EXISTS delivery_address,
      DROP COLUMN IF EXISTS transaction_image
    `);

    // Revert Sale Items additions
    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items
      DROP COLUMN IF EXISTS total_price
    `);

    // Revert Products additions
    await queryInterface.sequelize.query(`
      ALTER TABLE products
      DROP COLUMN IF EXISTS unit_id,
      DROP COLUMN IF EXISTS serial_number,
      DROP COLUMN IF EXISTS description_ar,
      DROP COLUMN IF EXISTS name_ar,
      DROP COLUMN IF EXISTS is_generated_barcode,
      DROP COLUMN IF EXISTS barcode
    `);
  }
};