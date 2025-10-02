'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales', 'related_id', {
      type: Sequelize.BIGINT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales', 'related_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};