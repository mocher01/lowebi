-- Admin AI Queue System - Migration 001
-- Version: v1.1.1.9.2.4.1.7
-- Created: 2025-08-07
-- Description: Admin AI Queue System database schema

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Admin Users table - Authentication for admin portal
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    password_hash TEXT NOT NULL,
    last_login DATETIME,
    permissions TEXT, -- JSON array of permissions
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    
    -- Security fields
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    created_by INTEGER REFERENCES admin_users(id)
);

-- Admin Sessions table - Session management for admin portal
CREATE TABLE admin_sessions (
    id TEXT PRIMARY KEY, -- JWT token ID or session ID
    admin_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- AI Requests table - Core AI generation queue system
CREATE TABLE ai_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Request identification
    customer_id TEXT NOT NULL,
    site_id TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('services', 'content', 'images', 'full_site')),
    
    -- Business context
    business_type TEXT NOT NULL,
    terminology TEXT, -- User-selected terminology (Services/Cours/Activités/etc)
    request_data TEXT NOT NULL, -- JSON with specific details
    
    -- Request management
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'processing', 'completed', 'rejected', 'cancelled')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=urgent, 5=normal, 10=low
    
    -- Cost management
    estimated_cost DECIMAL(5,2) DEFAULT 2.00,
    actual_cost DECIMAL(5,2),
    billing_status TEXT DEFAULT 'pending' CHECK (billing_status IN ('pending', 'billed', 'paid', 'refunded')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    
    -- Admin assignment
    admin_id INTEGER REFERENCES admin_users(id),
    admin_notes TEXT,
    
    -- Results
    generated_content TEXT, -- JSON result of AI generation
    
    -- Customer feedback
    customer_feedback INTEGER CHECK (customer_feedback BETWEEN 1 AND 5), -- 1-5 rating
    customer_notes TEXT,
    feedback_at DATETIME,
    
    -- Metadata
    wizard_session_id TEXT, -- Link to wizard session if applicable
    client_ip TEXT,
    user_agent TEXT,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- AI Request History - Track all status changes
CREATE TABLE ai_request_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER, -- admin_id who made the change
    change_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    old_values TEXT, -- JSON of old values if applicable
    new_values TEXT, -- JSON of new values if applicable
    
    FOREIGN KEY (request_id) REFERENCES ai_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Admin Activity Log - Full audit trail
CREATE TABLE admin_activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'assign', 'process'
    resource_type TEXT, -- 'ai_request', 'customer', 'site', 'admin_user', 'system'
    resource_id TEXT, -- ID of the resource being acted upon
    
    -- Change tracking
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    
    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    notes TEXT,
    
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Email Notifications Queue - For AI request notifications
CREATE TABLE email_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Email details
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    
    -- Context
    email_type TEXT NOT NULL, -- 'ai_request_confirmation', 'ai_request_completed', 'admin_notification'
    related_id INTEGER, -- ID of related record (ai_request_id, customer_id, etc)
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    
    -- Send attempts
    send_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Results
    sent_at DATETIME,
    error_message TEXT,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_ai_requests_status ON ai_requests(status);
CREATE INDEX idx_ai_requests_customer ON ai_requests(customer_id);
CREATE INDEX idx_ai_requests_admin ON ai_requests(admin_id);
CREATE INDEX idx_ai_requests_created ON ai_requests(created_at);
CREATE INDEX idx_ai_requests_priority ON ai_requests(priority);
CREATE INDEX idx_ai_requests_type ON ai_requests(request_type);

CREATE INDEX idx_ai_request_history_request ON ai_request_history(request_id);
CREATE INDEX idx_ai_request_history_created ON ai_request_history(created_at);

CREATE INDEX idx_admin_sessions_admin ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);

CREATE INDEX idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at);
CREATE INDEX idx_admin_activity_resource ON admin_activity_log(resource_type, resource_id);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_type ON email_queue(email_type);
CREATE INDEX idx_email_queue_next_attempt ON email_queue(next_attempt_at);

-- Insert default admin user (password: 'admin123' - CHANGE IN PRODUCTION!)
INSERT INTO admin_users (email, name, role, password_hash, permissions) VALUES (
    'admin@locod.ai',
    'Admin Locod.AI',
    'super_admin',
    '$2b$10$xB3ZwOjGl8T1R5qJ0s8F.OZF7.r8K4X6Y9Z3D4W5Q1N2M7P8S9T0V1', -- bcrypt hash of 'admin123'
    '["*"]'
);

-- Insert system configuration for AI queue
INSERT INTO system_config (key, value, description) VALUES
('ai_queue_enabled', '1', 'Enable AI queue system (1=enabled, 0=disabled)'),
('ai_queue_max_pending', '100', 'Maximum number of pending AI requests'),
('ai_queue_default_cost', '2.00', 'Default cost for AI generation requests'),
('ai_queue_max_priority', '1', 'Minimum priority value (1=most urgent)'),
('ai_queue_timeout_hours', '48', 'Hours before AI request times out'),
('email_notifications_enabled', '1', 'Enable email notifications (1=enabled, 0=disabled)'),
('email_smtp_host', '', 'SMTP server host for email sending'),
('email_smtp_port', '587', 'SMTP server port'),
('email_from_address', 'noreply@locod.ai', 'Default from email address');

-- Update schema version
UPDATE system_config SET value = '1.1.1.9.2.4.1.7' WHERE key = 'version';