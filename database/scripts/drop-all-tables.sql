-- Drop all tables and types in the database
-- This will allow a fresh start with synchronization

-- Drop all tables in public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restore default permissions
GRANT ALL ON SCHEMA public TO locod_user;
GRANT ALL ON SCHEMA public TO public;

-- Create UUID extension (needed for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";