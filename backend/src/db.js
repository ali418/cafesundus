// backend/db.js - Railway database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway/Hosted Postgres غالبا يحتاج SSL false reject check:
  ssl: { rejectUnauthorized: false }
});

// Test connection
pool.connect()
  .then(() => console.log("✅ Connected to Railway Postgres"))
  .catch(err => console.error("❌ Database connection error", err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};