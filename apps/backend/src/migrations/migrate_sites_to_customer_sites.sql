-- Migration: Consolidate sites table into customer_sites table
-- This script updates customer_sites schema to match sites table and migrates data

BEGIN;

-- Step 1: Add missing columns to customer_sites table to match sites structure
ALTER TABLE customer_sites 
  ADD COLUMN IF NOT EXISTS business_type VARCHAR,
  ADD COLUMN IF NOT EXISTS current_wizard_session_id UUID,
  ADD COLUMN IF NOT EXISTS site_config JSONB;

-- Step 2: Rename subdomain to domain to match sites table
ALTER TABLE customer_sites RENAME COLUMN subdomain TO domain;

-- Step 3: Add foreign key constraint for wizard session
ALTER TABLE customer_sites 
  ADD CONSTRAINT fk_customer_sites_wizard_session 
  FOREIGN KEY (current_wizard_session_id) 
  REFERENCES wizard_sessions(id) 
  ON DELETE SET NULL;

-- Step 4: Migrate existing data from sites to customer_sites
INSERT INTO customer_sites (
  id,
  customer_id,
  name,
  domain,
  business_type,
  status,
  current_wizard_session_id,
  site_config,
  deployment_url,
  last_deployed_at,
  created_at,
  updated_at
)
SELECT 
  id,
  customer_id,
  site_name as name,
  domain,
  business_type,
  status,
  current_wizard_session_id,
  site_config,
  deployment_url,
  deployed_at as last_deployed_at,
  created_at,
  updated_at
FROM sites
WHERE id NOT IN (SELECT id FROM customer_sites);

-- Step 5: Update wizard_sessions to point to customer_sites instead of sites
UPDATE wizard_sessions 
SET site_id = (
  SELECT cs.id 
  FROM customer_sites cs 
  WHERE cs.current_wizard_session_id = wizard_sessions.id
)
WHERE site_id IS NULL;

-- Step 6: Drop unnecessary columns from customer_sites that don't exist in sites
-- (Keep them for now, can be removed later if not needed)
-- ALTER TABLE customer_sites DROP COLUMN IF EXISTS theme;
-- ALTER TABLE customer_sites DROP COLUMN IF EXISTS template_id;
-- ALTER TABLE customer_sites DROP COLUMN IF EXISTS visitor_count;
-- ALTER TABLE customer_sites DROP COLUMN IF EXISTS page_views;

COMMIT;

-- Verify migration
SELECT 'Migration completed. customer_sites now has ' || COUNT(*) || ' records' FROM customer_sites;
SELECT 'Original sites table has ' || COUNT(*) || ' records' FROM sites;