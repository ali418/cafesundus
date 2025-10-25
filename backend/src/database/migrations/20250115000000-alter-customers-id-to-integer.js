'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if there are any existing customers with UUID IDs
    const existingCustomers = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM customers',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingCustomers[0].count > 0) {
      console.log('Warning: Existing customers found. This migration will clear the table.');
      // Backup existing data if needed
      await queryInterface.sequelize.query('DELETE FROM customers');
    }

    // Drop foreign key constraints that reference customers.id
    try {
      await queryInterface.removeConstraint('sales', 'sales_customer_id_fkey');
    } catch (error) {
      console.log('Foreign key constraint may not exist:', error.message);
    }

    // Drop the existing id column and recreate it as INTEGER with auto-increment
    await queryInterface.removeColumn('customers', 'id');
    
    await queryInterface.addColumn('customers', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    });

    // Recreate foreign key constraint in sales table
    try {
      // First, ensure sales.customer_id is also INTEGER
      await queryInterface.changeColumn('sales', 'customer_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch (error) {
      console.log('Sales table customer_id column update error:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a destructive migration - reverting is complex
    // Remove the INTEGER id column and recreate as UUID
    await queryInterface.removeColumn('customers', 'id');
    
    await queryInterface.addColumn('customers', 'id', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    });

    // Revert sales.customer_id back to UUID
    await queryInterface.changeColumn('sales', 'customer_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};