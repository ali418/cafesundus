const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/models');

const seedInventory = async () => {
  try {
    const now = new Date();

    // Fetch existing products
    const [products] = await sequelize.query(
      'SELECT id, name FROM products ORDER BY id'
    );

    if (!products || products.length === 0) {
      console.log('❌ No products found to seed inventory for');
      return;
    }

    // Fetch existing inventory product_ids to avoid duplicates
    const [existingInventory] = await sequelize.query(
      'SELECT product_id FROM inventory'
    );
    const existingSet = new Set(
      (existingInventory || []).map((row) => Number(row.product_id))
    );

    // Default quantities by product name (fallback to 50)
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
      if (existingSet.has(pid)) {
        console.log(`⏭️  Product ${p.name} (ID: ${pid}) already has inventory`);
        continue;
      }

      const def = defaultsByName[p.name] || { quantity: 50, location: 'Z1', min: 2 };
      rows.push({
        product_id: pid,
        quantity: def.quantity,
        location: def.location,
        min_quantity: def.min,
        created_at: now,
        updated_at: now,
      });
      console.log(`✅ Prepared inventory for ${p.name} (ID: ${pid}) - Qty: ${def.quantity}`);
    }

    if (rows.length > 0) {
      await sequelize.query(`
        INSERT INTO inventory (product_id, quantity, location, min_quantity, created_at, updated_at)
        VALUES ${rows.map(row => 
          `(${row.product_id}, ${row.quantity}, '${row.location}', ${row.min_quantity}, '${row.created_at.toISOString()}', '${row.updated_at.toISOString()}')`
        ).join(', ')}
      `);
      console.log(`🎉 Successfully inserted ${rows.length} inventory records`);
    } else {
      console.log('ℹ️  All products already have inventory records');
    }

    console.log('✅ Inventory seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

(async () => {
  try {
    await seedInventory();
    await sequelize.close();
  } catch (error) {
    await sequelize.close();
    process.exit(1);
  }
})();