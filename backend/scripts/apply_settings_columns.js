'use strict';

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function main() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'cafe_sundus',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  const statements = [
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS online_orders_enabled BOOLEAN DEFAULT false`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS online_orders_start_time VARCHAR(5) DEFAULT '08:00'`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS online_orders_end_time VARCHAR(5) DEFAULT '22:00'`,
    `ALTER TABLE settings ADD COLUMN IF NOT EXISTS online_orders_days JSONB`,
  ];

  try {
    for (const sql of statements) {
      await pool.query(sql);
      console.log('Applied:', sql);
    }
    console.log('All settings columns ensured.');
  } catch (err) {
    console.error('Failed to apply settings columns:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();