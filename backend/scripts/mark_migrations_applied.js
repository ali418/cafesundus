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

  const migrations = [
    '20230602000000-add-phone-to-users.js',
    '20250120000000-add-invoice-receipt-settings.js',
    '20250818194500-alter-notifications-user-id-uuid.js',
  ];

  try {
    await pool.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" ("name" VARCHAR(255) NOT NULL UNIQUE)');
    for (const name of migrations) {
      await pool.query('INSERT INTO "SequelizeMeta" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING', [name]);
      console.log(`Marked migration as applied: ${name}`);
    }
  } catch (err) {
    console.error('Failed to mark migrations:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();