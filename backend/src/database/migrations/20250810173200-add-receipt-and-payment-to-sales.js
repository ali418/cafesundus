'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add receipt_number column if missing
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255)
    `);

    // Add payment_method with CHECK constraint if missing
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) CHECK (payment_method IN ('cash','credit_card','debit_card','mobile_payment','other')) NOT NULL DEFAULT 'cash'
    `);

    // Add payment_status with CHECK constraint if missing
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) CHECK (payment_status IN ('pending','paid','partially_paid','refunded')) NOT NULL DEFAULT 'paid'
    `);

    // Add total_amount if missing
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS total_amount
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_status
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS payment_method
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS receipt_number
    `);
  }
};