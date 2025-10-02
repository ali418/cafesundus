'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      inventory_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      type: {
        type: Sequelize.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reference_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      previous_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      new_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('inventory_transactions', ['inventory_id']);
    await queryInterface.addIndex('inventory_transactions', ['user_id']);
    await queryInterface.addIndex('inventory_transactions', ['reference_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('inventory_transactions');
  },
};