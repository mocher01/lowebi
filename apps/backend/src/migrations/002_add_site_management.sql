-- Migration: Add Site Management Tables
-- Description: Create tables for site management and analytics
-- Version: 002
-- Date: 2025-08-16

-- Create enum types for site management
CREATE TYPE site_status AS ENUM (
    'draft',
    'deploying', 
    'deployed',
    'failed',
    'archived'
);

CREATE TYPE site_template AS ENUM (
    'business',
    'portfolio',
    'ecommerce',
    'blog',
    'landing',
    'custom'
);

CREATE TYPE analytics_event_type AS ENUM (
    'page_view',
    'session_start',
    'session_end',
    'contact_form',
    'button_click',
    'download',
    'external_link'
);

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    template site_template NOT NULL DEFAULT 'business',
    status site_status NOT NULL DEFAULT 'draft',
    configuration JSONB,
    metadata JSONB,
    build_path VARCHAR(500),
    deployment_url VARCHAR(500),
    last_deployed_at TIMESTAMP WITH TIME ZONE,
    page_views BIGINT DEFAULT 0,
    unique_visitors BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sites table
CREATE INDEX idx_sites_user_id ON sites(user_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_created_at ON sites(created_at);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_sites_is_active ON sites(is_active);

-- Create site_analytics table
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type analytics_event_type NOT NULL,
    page VARCHAR(500) NOT NULL,
    visitor_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    metadata JSONB,
    location JSONB,
    device JSONB,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for site_analytics table
CREATE INDEX idx_site_analytics_site_id ON site_analytics(site_id);
CREATE INDEX idx_site_analytics_event_type ON site_analytics(event_type);
CREATE INDEX idx_site_analytics_timestamp ON site_analytics(timestamp);
CREATE INDEX idx_site_analytics_visitor_id ON site_analytics(visitor_id);
CREATE INDEX idx_site_analytics_session_id ON site_analytics(session_id);

-- Create composite indexes for common queries
CREATE INDEX idx_site_analytics_site_event_time ON site_analytics(site_id, event_type, timestamp);
CREATE INDEX idx_site_analytics_visitor_time ON site_analytics(visitor_id, timestamp);

-- Add new audit actions to the existing audit_action enum
-- Note: This assumes the enum already exists from previous migration
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        -- If enum doesn't exist, create it with all values
        CREATE TYPE audit_action AS ENUM (
            'user_created',
            'user_updated',
            'user_deleted',
            'user_password_reset',
            'session_terminated',
            'bulk_session_terminated',
            'dashboard_accessed',
            'user_list_accessed',
            'user_details_accessed',
            'site_created',
            'site_updated',
            'site_deleted',
            'site_deployed',
            'site_bulk_operation',
            'site_list_accessed',
            'site_details_accessed',
            'site_analytics_accessed'
        );
    ELSE
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_created';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_updated';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_deleted';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_deployed';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_bulk_operation';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_list_accessed';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_details_accessed';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'site_analytics_accessed';
        EXCEPTION
            WHEN duplicate_object THEN
                -- Values already exist, continue
                NULL;
        END;
    END IF;
END $$;

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sites table
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update site analytics counters
CREATE OR REPLACE FUNCTION update_site_analytics_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Update page views counter
    IF NEW.event_type = 'page_view' THEN
        UPDATE sites 
        SET page_views = page_views + 1
        WHERE id = NEW.site_id;
    END IF;
    
    -- Update unique visitors counter (simplified logic)
    IF NEW.event_type = 'session_start' THEN
        UPDATE sites 
        SET unique_visitors = unique_visitors + 1
        WHERE id = NEW.site_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for analytics counters
DROP TRIGGER IF EXISTS update_analytics_counters ON site_analytics;
CREATE TRIGGER update_analytics_counters
    AFTER INSERT ON site_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_site_analytics_counters();

-- Grant permissions (adjust schema and user as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON sites TO current_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON site_analytics TO current_user;
GRANT USAGE ON SEQUENCE sites_id_seq TO current_user;
GRANT USAGE ON SEQUENCE site_analytics_id_seq TO current_user;

-- Insert some sample data for testing (optional)
INSERT INTO sites (name, domain, description, template, user_id) 
SELECT 
    'Sample Business Site',
    'sample-business.example.com',
    'A sample business website for testing',
    'business',
    u.id
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1
ON CONFLICT (domain) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE sites IS 'Stores website information and configuration';
COMMENT ON TABLE site_analytics IS 'Stores website analytics and visitor tracking data';
COMMENT ON COLUMN sites.configuration IS 'JSON configuration for site generation';
COMMENT ON COLUMN sites.metadata IS 'Additional metadata for the site';
COMMENT ON COLUMN site_analytics.metadata IS 'Event-specific data and custom properties';
COMMENT ON COLUMN site_analytics.location IS 'Geographic location data for the visitor';
COMMENT ON COLUMN site_analytics.device IS 'Device and browser information';

-- Create a view for site statistics (optional but useful)
CREATE OR REPLACE VIEW site_statistics AS
SELECT 
    s.id,
    s.name,
    s.domain,
    s.status,
    s.template,
    s.page_views,
    s.unique_visitors,
    s.created_at,
    s.last_deployed_at,
    COUNT(DISTINCT sa.visitor_id) AS tracked_visitors,
    COUNT(sa.id) FILTER (WHERE sa.event_type = 'page_view') AS tracked_page_views,
    COUNT(sa.id) FILTER (WHERE sa.timestamp >= CURRENT_DATE) AS today_events,
    COUNT(sa.id) FILTER (WHERE sa.timestamp >= CURRENT_DATE - INTERVAL '7 days') AS week_events,
    COUNT(sa.id) FILTER (WHERE sa.timestamp >= CURRENT_DATE - INTERVAL '30 days') AS month_events
FROM sites s
LEFT JOIN site_analytics sa ON s.id = sa.site_id
GROUP BY s.id, s.name, s.domain, s.status, s.template, s.page_views, s.unique_visitors, s.created_at, s.last_deployed_at;

COMMENT ON VIEW site_statistics IS 'Aggregated statistics for all sites including analytics data';