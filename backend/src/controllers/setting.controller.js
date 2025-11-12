const { Setting } = require('../models');

// Get settings (single row, create default if not exists)
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// Update settings (upsert behavior) with robust handling for online_orders_days
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    // Clone body to avoid mutating original
    const updates = { ...req.body };

    // Normalize online_orders_days if provided
    // Supports both JSONB and Postgres integer[] schemas in production
    if (Array.isArray(updates.online_orders_days)) {
      try {
        const [rows] = await Setting.sequelize.query(
          `SELECT data_type, udt_name FROM information_schema.columns 
           WHERE table_name = 'settings' AND column_name = 'online_orders_days' 
           LIMIT 1`
        );
        const col = rows && rows[0] ? rows[0] : null;
        const udt = col?.udt_name;
        const dataType = col?.data_type;

        // If column is integer[] (udt_name = '_int4'), prefer raw update with curly-brace format
        if (udt === '_int4' || dataType === 'ARRAY') {
          const postgresDays = `{${updates.online_orders_days.join(',')}}`;

          if (!settings) {
            // Create row first without the array column
            const createPayload = { ...updates };
            delete createPayload.online_orders_days;
            settings = await Setting.create(createPayload);
          } else {
            // Update other fields via model
            const updatePayload = { ...updates };
            delete updatePayload.online_orders_days;
            await settings.update(updatePayload);
          }

          // Then update array column via raw SQL to avoid type mismatch
          await Setting.sequelize.query(
            'UPDATE settings SET online_orders_days = CAST(:days AS integer[]) WHERE id = :id',
            { replacements: { days: postgresDays, id: settings.id } }
          );

          // Reload to reflect latest
          await settings.reload();

          return res.status(200).json({ success: true, data: settings });
        }
        // If column is JSONB, let Sequelize handle array natively
      } catch (e) {
        // If introspection fails, fall back to passing array as-is
      }
    }

    if (!settings) {
      settings = await Setting.create(updates);
    } else {
      await settings.update(updates);
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};