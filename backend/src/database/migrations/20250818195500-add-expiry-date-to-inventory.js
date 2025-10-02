'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add expiry_date column to inventory table
    await queryInterface.addColumn('inventory', 'expiry_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Optional: index to query by expiry date
    try {
      await queryInterface.addIndex('inventory', ['expiry_date'], { name: 'inventory_expiry_date_idx' });
    } catch (e) {
      // ignore if index exists
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('inventory', 'inventory_expiry_date_idx');
    } catch (e) {
      // ignore
    }
    await queryInterface.removeColumn('inventory', 'expiry_date');
  }
};