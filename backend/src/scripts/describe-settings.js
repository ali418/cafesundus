const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { sequelize } = require('../models');

(async () => {
  try {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('settings');
    console.log('settings columns:');
    console.log(JSON.stringify(desc, null, 2));
  } catch (err) {
    console.error('Error describing table:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();