'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure table exists then replace user_id with UUID type referencing users.id
    let table;
    try {
      table = await queryInterface.describeTable('notifications');
    } catch (e) {
      table = null;
    }

    if (table && table.user_id) {
      // Drop existing index if present to avoid dependency issues
      try { await queryInterface.removeIndex('notifications', ['user_id']); } catch (_) {}
      await queryInterface.removeColumn('notifications', 'user_id');
    }

    await queryInterface.addColumn('notifications', 'user_id', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // Recreate helpful index
    try { await queryInterface.addIndex('notifications', ['user_id']); } catch (_) {}
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to INTEGER user_id if needed
    try { await queryInterface.removeIndex('notifications', ['user_id']); } catch (_) {}
    try { await queryInterface.removeColumn('notifications', 'user_id'); } catch (_) {}

    await queryInterface.addColumn('notifications', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    try { await queryInterface.addIndex('notifications', ['user_id']); } catch (_) {}
  }
};