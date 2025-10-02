const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Database connection parameters
const dbName = process.env.DB_NAME || 'cafe_sundus';
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';

// Path for schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');

// Command to generate schema
const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --schema-only --no-owner --no-privileges`;

console.log('Generating schema.sql file...');
console.log(`Using database: ${dbName}`);

// Set PGPASSWORD environment variable
process.env.PGPASSWORD = dbPass;

// Execute pg_dump command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  // Write schema to file
  fs.writeFileSync(schemaPath, stdout);
  console.log(`Schema file generated at: ${schemaPath}`);
});