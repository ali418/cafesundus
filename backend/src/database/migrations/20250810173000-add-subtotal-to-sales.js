'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add subtotal column if it does not exist
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) NOT NULL DEFAULT 0
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove subtotal column if it exists
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS subtotal
    `);
  }
};