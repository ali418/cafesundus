'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableInfo = await queryInterface.describeTable('products');
    if (!tableInfo.image_url) {
      await queryInterface.addColumn('products', 'image_url', {
        type: Sequelize.STRING,
        allowNull: true,
        after: 'category'
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('products', 'image_url');
  },
};