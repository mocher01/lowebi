-- Setup PostgreSQL for Website Generator V2
-- Run as postgres superuser

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'website_gen_user') THEN
      CREATE USER website_gen_user WITH PASSWORD 'website_gen_pass';
   END IF;
END
$do$;

-- Create database if not exists
SELECT 'CREATE DATABASE website_generator_v2'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'website_generator_v2')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE website_generator_v2 TO website_gen_user;

-- Connect to the new database
\c website_generator_v2

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO website_gen_user;