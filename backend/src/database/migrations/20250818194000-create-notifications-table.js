'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notifications table if it doesn't exist (safe for environments where the table was created manually)
    let tableExists = true;
    try {
      await queryInterface.describeTable('notifications');
    } catch (e) {
      tableExists = false;
    }

    if (!tableExists) {
      await queryInterface.createTable('notifications', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        type: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        related_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        related_type: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }

    // Ensure indexes exist (safe to run even if table existed)
    try { await queryInterface.addIndex('notifications', ['user_id']); } catch (_) {}
    try { await queryInterface.addIndex('notifications', ['is_read']); } catch (_) {}
    try { await queryInterface.addIndex('notifications', ['created_at']); } catch (_) {}
  },

  down: async (queryInterface) => {
    // Drop table if it exists
    let tableExists = true;
    try {
      await queryInterface.describeTable('notifications');
    } catch (e) {
      tableExists = false;
    }

    if (tableExists) {
      await queryInterface.dropTable('notifications');
    }
  },
};