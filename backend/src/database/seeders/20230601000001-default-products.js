'use strict';
// Remove UUID import as we're using auto-incrementing IDs

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('products', [
      {
        // Remove id field to let the database auto-increment
        name: 'Rice',
        description: 'Premium quality basmati rice',
        price: 5.99,
        stock: 100,
        category: 'Grains',
        // Removed imageUrl field as it doesn't exist in the database
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // Remove id field to let the database auto-increment
        name: 'Milk',
        description: 'Fresh whole milk',
        price: 2.49,
        stock: 50,
        category: 'Dairy',
        // Removed imageUrl field as it doesn't exist in the database
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // Remove id field to let the database auto-increment
        name: 'Bread',
        description: 'Whole wheat bread',
        price: 3.29,
        stock: 30,
        category: 'Bakery',
        // Removed imageUrl field as it doesn't exist in the database
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // Remove id field to let the database auto-increment
        name: 'Eggs',
        description: 'Farm fresh eggs',
        price: 4.99,
        stock: 40,
        category: 'Dairy',
        // Removed imageUrl field as it doesn't exist in the database
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        // Remove id field to let the database auto-increment
        name: 'Chicken',
        description: 'Boneless chicken breast',
        price: 8.99,
        stock: 25,
        category: 'Meat',
        // Removed imageUrl field as it doesn't exist in the database
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};