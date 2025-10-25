'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add display_order column to categories table
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
    `);

    // Update existing categories with incremental display_order values
    await queryInterface.sequelize.query(`
      UPDATE categories 
      SET display_order = (
        SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1
        FROM (SELECT id, created_at FROM categories) AS sub
        WHERE sub.id = categories.id
      )
      WHERE display_order IS NULL OR display_order = 0
    `);

    // Create index for better performance when ordering
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS categories_display_order_idx ON categories(display_order)
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop index
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS categories_display_order_idx
    `);

    // Remove display_order column
    await queryInterface.sequelize.query(`
      ALTER TABLE categories
      DROP COLUMN IF EXISTS display_order
    `);
  }
};