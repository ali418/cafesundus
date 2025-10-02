'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop existing columns that were added incorrectly
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_method
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_status
    `);

    // Create ENUM types if they don't exist
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sales_payment_method') THEN
          CREATE TYPE enum_sales_payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'mobile_payment', 'other');
        END IF;
      END
      $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_sales_payment_status') THEN
          CREATE TYPE enum_sales_payment_status AS ENUM ('pending', 'paid', 'partially_paid', 'refunded');
        END IF;
      END
      $$;
    `);

    // Ensure all enum values exist (idempotent)
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_method ADD VALUE IF NOT EXISTS 'cash';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_method ADD VALUE IF NOT EXISTS 'credit_card';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_method ADD VALUE IF NOT EXISTS 'debit_card';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_method ADD VALUE IF NOT EXISTS 'mobile_payment';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_method ADD VALUE IF NOT EXISTS 'other';`);

    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_status ADD VALUE IF NOT EXISTS 'pending';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_status ADD VALUE IF NOT EXISTS 'paid';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_status ADD VALUE IF NOT EXISTS 'partially_paid';`);
    await queryInterface.sequelize.query(`ALTER TYPE enum_sales_payment_status ADD VALUE IF NOT EXISTS 'refunded';`);

    // Add columns with proper ENUM types and casted defaults
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_method enum_sales_payment_method NOT NULL DEFAULT 'cash'::enum_sales_payment_method
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_status enum_sales_payment_status NOT NULL DEFAULT 'paid'::enum_sales_payment_status
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_status
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_method
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_sales_payment_status
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_sales_payment_method
    `);
  }
};