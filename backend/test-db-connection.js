const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cafe_sundus',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    const res = await client.query('SELECT current_database() as db_name');
    console.log(`✅ Connected to database: ${res.rows[0].db_name}`);
    return true;
  } catch (err) {
    console.error('❌ Error connecting to the database:', err);
    return false;
  } finally {
    await client.end();
  }
}

testConnection();