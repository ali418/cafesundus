-- Fix created_at column issue
UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();