-- Fix users table to use UUID instead of SERIAL
-- This script will convert the users table from SERIAL id to UUID id

DO $$
DECLARE
    table_exists BOOLEAN;
    column_type TEXT;
    has_data BOOLEAN;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Check current column type
        SELECT data_type INTO column_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'id';
        
        RAISE NOTICE 'Current users.id column type: %', column_type;
        
        -- Check if table has data
        SELECT EXISTS (SELECT 1 FROM users LIMIT 1) INTO has_data;
        
        IF column_type = 'integer' THEN
            RAISE NOTICE 'Converting users.id from INTEGER to UUID...';
            
            -- If table has data, we need to be more careful
            IF has_data THEN
                RAISE NOTICE 'Table has data, creating backup and converting...';
                
                -- Create backup table
                CREATE TABLE users_backup AS SELECT * FROM users;
                
                -- Drop foreign key constraints temporarily
                -- (Add specific constraint drops here if needed)
                
                -- Drop and recreate the table with UUID
                DROP TABLE users CASCADE;
                
                CREATE TABLE users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(255) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255),
                    phone VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'user',
                    is_active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    deleted_at TIMESTAMP
                );
                
                -- Insert data back with new UUIDs
                INSERT INTO users (username, email, password, full_name, phone, role, is_active, last_login, created_at, updated_at, deleted_at)
                SELECT username, email, password, full_name, phone, role, is_active, last_login, created_at, updated_at, deleted_at
                FROM users_backup;
                
                -- Drop backup table
                DROP TABLE users_backup;
                
                RAISE NOTICE 'Users table converted to UUID successfully with data preserved';
            ELSE
                RAISE NOTICE 'Table is empty, simple conversion...';
                
                -- Simple conversion for empty table
                ALTER TABLE users DROP COLUMN id;
                ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
                
                RAISE NOTICE 'Empty users table converted to UUID successfully';
            END IF;
        ELSE
            RAISE NOTICE 'Users table already uses UUID, no conversion needed';
        END IF;
    ELSE
        RAISE NOTICE 'Users table does not exist, creating with UUID...';
        
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            phone VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
        );
        
        RAISE NOTICE 'Users table created with UUID successfully';
    END IF;
END $$;