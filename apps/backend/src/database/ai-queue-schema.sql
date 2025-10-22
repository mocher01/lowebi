-- Issue #90.2: AI Queue Tables for PostgreSQL
-- Simple direct schema creation

-- Create enums for AI requests
CREATE TYPE request_type_enum AS ENUM (
    'services', 'hero', 'about', 'testimonials', 'faq', 'seo'
);

CREATE TYPE request_status_enum AS ENUM (
    'pending', 'assigned', 'processing', 'completed', 'rejected'
);

CREATE TYPE admin_action_enum AS ENUM (
    'assign', 'start', 'complete', 'reject', 'update', 'cancel'
);

-- Main AI requests table
CREATE TABLE ai_requests (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(255) NOT NULL,
    customer_id INTEGER NOT NULL,
    request_type request_type_enum NOT NULL,
    status request_status_enum NOT NULL DEFAULT 'pending',
    admin_id INTEGER,
    request_data JSONB NOT NULL,
    generated_content JSONB,
    processing_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2)
);

-- Admin activity logging
CREATE TABLE admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    action admin_action_enum NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- AI request history tracking
CREATE TABLE ai_request_history (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
    previous_status request_status_enum,
    new_status request_status_enum NOT NULL,
    changed_by INTEGER NOT NULL,
    change_reason TEXT,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_ai_requests_status ON ai_requests(status);
CREATE INDEX idx_ai_requests_customer ON ai_requests(customer_id);
CREATE INDEX idx_ai_requests_admin ON ai_requests(admin_id);
CREATE INDEX idx_ai_requests_created ON ai_requests(created_at);
CREATE INDEX idx_admin_activity_target ON admin_activity_log(target_type, target_id);
CREATE INDEX idx_admin_activity_timestamp ON admin_activity_log(timestamp);
CREATE INDEX idx_ai_history_request ON ai_request_history(request_id);

-- Add comments for documentation
COMMENT ON TABLE ai_requests IS 'Main table for AI content generation requests';
COMMENT ON TABLE admin_activity_log IS 'Audit trail for all admin actions';
COMMENT ON TABLE ai_request_history IS 'History of status changes for AI requests';