'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new enum values to the role column
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'storekeeper';
      ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'accountant';
      ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'staff';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This is a no-op migration for down
    console.log('Cannot remove enum values in PostgreSQL');
  }
};