'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to sales table
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS status VARCHAR(255) CHECK (status IN ('pending', 'completed', 'cancelled')) NOT NULL DEFAULT 'completed'
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS notes
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sales
      DROP COLUMN IF EXISTS status
    `);
  }
};