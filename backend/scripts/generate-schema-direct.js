const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// Create directory if it doesn't exist
const databaseDir = path.join(__dirname, '../../database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir, { recursive: true });
}

// Path for schema.sql
const schemaPath = path.join(databaseDir, 'schema.sql');

// Database connection parameters
const dbName = process.env.DB_NAME || 'cafe_sundus';
const dbUser = process.env.DB_USER || 'postgres';
const dbPass = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';

// Create PostgreSQL client
const client = new Client({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPass,
  port: dbPort,
});

// Function to generate schema
async function generateSchema() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connection established successfully.');

    // Write to schema.sql file
    fs.writeFileSync(schemaPath, '-- Auto-generated schema.sql file\n');
    fs.appendFileSync(schemaPath, '-- Generated on: ' + new Date().toISOString() + '\n\n');
    
    // Get table list
    const tableQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    const tableResult = await client.query(tableQuery);
    const tables = tableResult.rows;
    console.log(`Found ${tables.length} tables in database`);
    
    // For each table, get detailed structure
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`Processing table: ${tableName}`);
      
      // Get table structure
      const tableStructureQuery = `
        SELECT 
          column_name, 
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public' AND table_name = $1
        ORDER BY 
          ordinal_position;
      `;
      
      const tableStructureResult = await client.query(tableStructureQuery, [tableName]);
      const columns = tableStructureResult.rows;
      
      // Start building CREATE TABLE statement
      let createTableStatement = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
      
      // Add column definitions
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        let columnDef = `  "${column.column_name}" ${column.data_type}`;
        
        // Add length for character types
        if (column.character_maximum_length) {
          columnDef += `(${column.character_maximum_length})`;
        }
        
        // Add nullable constraint
        if (column.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        // Add default value if exists
        if (column.column_default) {
          columnDef += ` DEFAULT ${column.column_default}`;
        }
        
        // Add comma if not the last column
        if (i < columns.length - 1) {
          columnDef += ',';
        }
        
        createTableStatement += columnDef + '\n';
      }
      
      // Get primary key constraints
      const pkQuery = `
        SELECT
          kcu.column_name
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public'
        ORDER BY
          kcu.ordinal_position;
      `;
      
      const pkResult = await client.query(pkQuery, [tableName]);
      
      // Add primary key constraint if exists
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(row => `"${row.column_name}"`).join(', ');
        if (columns.length > 0) {
          createTableStatement += ',\n';
        }
        createTableStatement += `  PRIMARY KEY (${pkColumns})`;
      }
      
      // Get foreign key constraints
      const fkQuery = `
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          tc.constraint_name
        FROM
          information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
          tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = $1
          AND tc.table_schema = 'public';
      `;
      
      const fkResult = await client.query(fkQuery, [tableName]);
      
      // Add foreign key constraints
      for (let i = 0; i < fkResult.rows.length; i++) {
        const fk = fkResult.rows[i];
        if (i === 0 && pkResult.rows.length === 0 && columns.length > 0) {
          createTableStatement += ',\n';
        } else if (i > 0) {
          createTableStatement += ',\n';
        }
        
        createTableStatement += `  CONSTRAINT "${fk.constraint_name}" FOREIGN KEY ("${fk.column_name}") ` +
          `REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}")`;
      }
      
      // Finalize CREATE TABLE statement
      createTableStatement += '\n);\n\n';
      
      // Write table creation statement
      fs.appendFileSync(schemaPath, `-- Table: ${tableName}\n${createTableStatement}`);
      
      // Get indices for this table
      const indexQuery = `
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1 AND indexname NOT LIKE '%_pkey';
      `;
      
      const indexResults = await client.query(indexQuery, [tableName]);
      
      // Add index creation statements
      if (indexResults.rows.length > 0) {
        fs.appendFileSync(schemaPath, `-- Indices for table: ${tableName}\n`);
        indexResults.rows.forEach(result => {
          fs.appendFileSync(schemaPath, result.indexdef + ';\n');
        });
        fs.appendFileSync(schemaPath, '\n');
      }
    }

    console.log(`Schema file generated at: ${schemaPath}`);
  } catch (error) {
    console.error('Error generating schema:', error);
  } finally {
    await client.end();
  }
}

// Run the function
generateSchema();