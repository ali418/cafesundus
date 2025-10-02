'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // Fetch existing products
    const [products] = await queryInterface.sequelize.query(
      'SELECT id, name FROM products ORDER BY id'
    );

    if (!products || products.length === 0) {
      return; // Nothing to seed
    }

    // Fetch existing inventory product_ids to avoid duplicates on re-run
    const [existingInventory] = await queryInterface.sequelize.query(
      'SELECT product_id FROM inventory'
    );
    const existingSet = new Set(
      (existingInventory || []).map((row) => Number(row.product_id))
    );

    // Some realistic default quantities by product name (fallback to 50)
    const defaultsByName = {
      Rice: { quantity: 120, location: 'A1', min: 10 },
      Milk: { quantity: 80, location: 'A2', min: 8 },
      Bread: { quantity: 60, location: 'B1', min: 6 },
      Eggs: { quantity: 100, location: 'B2', min: 12 },
      Chicken: { quantity: 40, location: 'C1', min: 5 },
    };

    const rows = [];
    for (const p of products) {
      const pid = Number(p.id);
      if (existingSet.has(pid)) continue;

      const def = defaultsByName[p.name] || { quantity: 50, location: 'Z1', min: 2 };
      rows.push({
        product_id: pid,
        quantity: def.quantity,
        location: def.location,
        min_quantity: def.min,
        created_at: now,
        updated_at: now,
      });
    }

    if (rows.length > 0) {
      await queryInterface.bulkInsert('inventory', rows);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the seeded inventory rows we added in up()
    const [products] = await queryInterface.sequelize.query(
      'SELECT id, name FROM products ORDER BY id'
    );

    if (!products || products.length === 0) {
      return; // Nothing to delete
    }

    const productIds = products.map((p) => Number(p.id));
    if (productIds.length > 0) {
      await queryInterface.bulkDelete('inventory', {
        product_id: { [Sequelize.Op.in]: productIds },
      });
    }
  },
};