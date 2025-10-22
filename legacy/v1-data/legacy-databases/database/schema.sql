-- Multi-Tenant Website Generator Database Schema
-- Version: v1.1.1.9.2.4.2.1.1
-- Created: 2025-08-04

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Customers table - Multi-tenant foundation
CREATE TABLE customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company_name TEXT,
    plan_type TEXT DEFAULT 'starter' CHECK (plan_type IN ('starter', 'pro', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Resource quotas
    max_sites INTEGER DEFAULT 5,
    max_storage_mb INTEGER DEFAULT 1000,
    max_bandwidth_gb INTEGER DEFAULT 10,
    
    -- Billing info placeholders
    stripe_customer_id TEXT,
    billing_email TEXT,
    
    -- Metadata
    metadata TEXT -- JSON field for flexible data
);

-- Sites table - Core site configurations
CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    domain TEXT,
    status TEXT DEFAULT 'created' CHECK (status IN ('created', 'building', 'deploying', 'deployed', 'failed', 'error', 'archived')),
    port INTEGER,
    
    -- Site configuration (JSON)
    config TEXT NOT NULL, -- JSON site-config content
    
    -- Deployment info
    deployed_at DATETIME,
    last_build_at DATETIME,
    build_status TEXT CHECK (build_status IN ('pending', 'building', 'success', 'error')),
    build_logs TEXT,
    
    -- URLs and access
    url TEXT,
    admin_url TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Resource usage
    storage_used_mb INTEGER DEFAULT 0,
    bandwidth_used_gb INTEGER DEFAULT 0,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Site deployments history
CREATE TABLE site_deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'building', 'success', 'error', 'rollback')),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error_message TEXT,
    build_logs TEXT,
    
    -- Deployment metadata
    deployed_by TEXT, -- customer_id or 'system'
    deployment_type TEXT DEFAULT 'manual' CHECK (deployment_type IN ('manual', 'webhook', 'scheduled', 'rollback')),
    
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Site backups for rollback functionality
CREATE TABLE site_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    backup_name TEXT NOT NULL,
    config_snapshot TEXT NOT NULL, -- JSON backup of site config
    files_path TEXT, -- Path to backed up files
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- customer_id or 'system'
    
    -- Backup metadata
    size_mb INTEGER DEFAULT 0,
    backup_type TEXT DEFAULT 'manual' CHECK (backup_type IN ('manual', 'auto', 'pre_deployment')),
    
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- API keys for customer access
CREATE TABLE api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL, -- JSON array of permissions
    expires_at DATETIME,
    last_used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Customer sessions for web portal
CREATE TABLE customer_sessions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Resource usage tracking
CREATE TABLE resource_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT NOT NULL,
    site_id TEXT,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('storage', 'bandwidth', 'deployments', 'api_calls')),
    amount REAL NOT NULL,
    unit TEXT NOT NULL, -- 'mb', 'gb', 'count'
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Billing period
    billing_period TEXT, -- '2024-08' format
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

-- System configuration
CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sites_customer_id ON sites(customer_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_deployments_site_id ON site_deployments(site_id);
CREATE INDEX idx_deployments_status ON site_deployments(status);
CREATE INDEX idx_backups_site_id ON site_backups(site_id);
CREATE INDEX idx_api_keys_customer_id ON api_keys(customer_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_sessions_customer_id ON customer_sessions(customer_id);
CREATE INDEX idx_sessions_expires ON customer_sessions(expires_at);
CREATE INDEX idx_usage_customer ON resource_usage(customer_id);
CREATE INDEX idx_usage_period ON resource_usage(billing_period);

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('version', '1.1.1.9.2.4.2.1.1', 'Database schema version'),
('max_sites_per_customer', '5', 'Default maximum sites per customer'),
('default_storage_quota_mb', '1000', 'Default storage quota in MB'),
('default_bandwidth_quota_gb', '10', 'Default bandwidth quota in GB'),
('session_timeout_hours', '24', 'Session timeout in hours'),
('api_key_default_expiry_days', '365', 'Default API key expiry in days');