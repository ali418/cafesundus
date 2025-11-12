'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add online order availability fields to settings table
    const table = await queryInterface.describeTable('settings');

    if (!table.online_orders_enabled) {
      await queryInterface.addColumn('settings', 'online_orders_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    }

    if (!table.online_orders_start_time) {
      await queryInterface.addColumn('settings', 'online_orders_start_time', {
        type: Sequelize.STRING(5), // 'HH:mm'
        allowNull: true,
        defaultValue: '08:00',
      });
    }

    if (!table.online_orders_end_time) {
      await queryInterface.addColumn('settings', 'online_orders_end_time', {
        type: Sequelize.STRING(5), // 'HH:mm'
        allowNull: true,
        defaultValue: '22:00',
      });
    }

    if (!table.online_orders_days) {
      await queryInterface.addColumn('settings', 'online_orders_days', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null, // Array of numbers (0-6)
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('settings');
    if (table.online_orders_days) {
      await queryInterface.removeColumn('settings', 'online_orders_days');
    }
    if (table.online_orders_end_time) {
      await queryInterface.removeColumn('settings', 'online_orders_end_time');
    }
    if (table.online_orders_start_time) {
      await queryInterface.removeColumn('settings', 'online_orders_start_time');
    }
    if (table.online_orders_enabled) {
      await queryInterface.removeColumn('settings', 'online_orders_enabled');
    }
  },
};