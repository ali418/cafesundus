'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ensure sale_items.product_id is INTEGER and FK to products(id)
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        r record;
      BEGIN
        -- Drop any FK constraint(s) on product_id if exist
        FOR r IN (
          SELECT tc.constraint_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public'
            AND tc.table_name = 'sale_items'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'product_id'
        ) LOOP
          EXECUTE format('ALTER TABLE sale_items DROP CONSTRAINT %I', r.constraint_name);
        END LOOP;
      END$$;
    `);

    // Drop the existing column (uuid) and recreate as INTEGER
    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items
      DROP COLUMN IF EXISTS product_id
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items
      ADD COLUMN product_id INTEGER
    `);

    // Recreate FK constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    // Optional: create index on product_id
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = 'sale_items_product_id_idx' AND n.nspname = 'public'
        ) THEN
          CREATE INDEX sale_items_product_id_idx ON sale_items(product_id);
        END IF;
      END$$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Best-effort revert: drop FK, drop column, add back as UUID (nullable)
    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items DROP COLUMN IF EXISTS product_id
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE sale_items ADD COLUMN product_id UUID
    `);
  }
};