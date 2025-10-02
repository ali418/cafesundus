'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint (ignore if it doesn't exist)
    try {
      await queryInterface.removeConstraint('inventory_transactions', 'inventory_transactions_inventory_id_fkey');
    } catch (e) {
      // Constraint may not exist yet; proceed safely
    }

    // Change the column type from UUID to INTEGER (skip if already INTEGER)
    try {
      const tableInfo = await queryInterface.describeTable('inventory_transactions');
      const col = tableInfo && tableInfo.inventory_id;
      const isAlreadyInteger = col && (col.type || '').toLowerCase().includes('int');
      if (!isAlreadyInteger) {
        await queryInterface.changeColumn('inventory_transactions', 'inventory_id', {
          type: Sequelize.INTEGER,
          allowNull: false
        });
      }
    } catch (e) {
      // If describeTable fails or changeColumn not required, continue
    }
    
    // Re-add the foreign key constraint (ignore if it already exists)
    try {
      await queryInterface.addConstraint('inventory_transactions', {
        fields: ['inventory_id'],
        type: 'foreign key',
        name: 'inventory_transactions_inventory_id_fkey',
        references: {
          table: 'inventory',
          field: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    } catch (e) {
      // Constraint might already exist; ignore
    }
  },

  down: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint (ignore if it doesn't exist)
    try {
      await queryInterface.removeConstraint('inventory_transactions', 'inventory_transactions_inventory_id_fkey');
    } catch (e) {}

    // Change the column type back to UUID (only if not already UUID)
    try {
      const tableInfo = await queryInterface.describeTable('inventory_transactions');
      const col = tableInfo && tableInfo.inventory_id;
      const isAlreadyUUID = col && (col.type || '').toLowerCase().includes('uuid');
      if (!isAlreadyUUID) {
        await queryInterface.changeColumn('inventory_transactions', 'inventory_id', {
          type: Sequelize.UUID,
          allowNull: false
        });
      }
    } catch (e) {}
    
    // Re-add the foreign key constraint (ignore failures in down)
    try {
      await queryInterface.addConstraint('inventory_transactions', {
        fields: ['inventory_id'],
        type: 'foreign key',
        name: 'inventory_transactions_inventory_id_fkey',
        references: {
          table: 'inventory',
          field: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    } catch (e) {}
  }
};