'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL specific way to update an enum type
    return queryInterface.sequelize.query(`
      ALTER TYPE "enum_sales_status" ADD VALUE IF NOT EXISTS 'accepted';
      ALTER TYPE "enum_sales_status" ADD VALUE IF NOT EXISTS 'rejected';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Cannot remove values from an enum in PostgreSQL
    // This is a no-op, but you could create a new enum and migrate data if needed
    return Promise.resolve();
  }
};