const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
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

// Create Sequelize instance
const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false
});

// Function to generate schema
async function generateSchema() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
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
    
    const [tables] = await sequelize.query(tableQuery);
    console.log(`Found ${tables.length} tables in database`);
    
    // For each table, get detailed CREATE TABLE statement
    for (const table of tables) {
      const tableName = table.tablename;
      console.log(`Processing table: ${tableName}`);
      
      // Get table creation SQL with proper constraints
      const tableDefQuery = `
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || 
          quote_ident('${tableName}') || ' (\n  ' ||
          string_agg(
            quote_ident(column_name) || ' ' || 
            data_type || 
            CASE WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')' 
                ELSE '' 
            END || 
            CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN column_default IS NOT NULL 
                THEN ' DEFAULT ' || column_default 
                ELSE '' 
            END,
            ',\n  '
          ) as column_definitions
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '${tableName}'
        GROUP BY table_name;
      `;
      
      const [tableDefResult] = await sequelize.query(tableDefQuery);
      
      if (tableDefResult.length > 0) {
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
            AND tc.table_name = '${tableName}'
            AND tc.table_schema = 'public'
          ORDER BY
            kcu.ordinal_position;
        `;
        
        const [pkResult] = await sequelize.query(pkQuery);
        
        let createTableStatement = tableDefResult[0].column_definitions;
        
        // Add primary key constraint if exists
        if (pkResult.length > 0) {
          const pkColumns = pkResult.map(row => quote(row.column_name)).join(', ');
          createTableStatement += `,\n  PRIMARY KEY (${pkColumns})`;
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
            AND tc.table_name = '${tableName}'
            AND tc.table_schema = 'public';
        `;
        
        const [fkResult] = await sequelize.query(fkQuery);
        
        // Add foreign key constraints
        for (const fk of fkResult) {
          createTableStatement += `,\n  CONSTRAINT ${quote(fk.constraint_name)} FOREIGN KEY (${quote(fk.column_name)}) ` +
            `REFERENCES ${quote(fk.foreign_table_name)} (${quote(fk.foreign_column_name)})`;
        }
        
        // Finalize CREATE TABLE statement
        createTableStatement = `${tableDefResult[0].column_definitions.split('(\n  ')[0]}(\n  ${createTableStatement}\n);`;
        
        // Write table creation statement
        fs.appendFileSync(schemaPath, `-- Table: ${tableName}\n${createTableStatement}\n\n`);
      }
      
      // Get indices for this table
      const indexQuery = `
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = '${tableName}' AND indexname NOT LIKE '%_pkey';
      `;
      
      const [indexResults] = await sequelize.query(indexQuery);
      
      // Add index creation statements
      if (indexResults.length > 0) {
        fs.appendFileSync(schemaPath, `-- Indices for table: ${tableName}\n`);
        indexResults.forEach(result => {
          fs.appendFileSync(schemaPath, result.indexdef + ';\n');
        });
        fs.appendFileSync(schemaPath, '\n');
      }
    }

    console.log(`Schema file generated at: ${schemaPath}`);
  } catch (error) {
    console.error('Error generating schema:', error);
  } finally {
    await sequelize.close();
  }
}

// Helper function to quote identifiers
function quote(identifier) {
  return `"${identifier}"`;
}

// Run the function
generateSchema();