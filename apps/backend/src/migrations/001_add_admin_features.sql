-- Migration: Add admin features (Session updates and AuditLog)
-- Date: 2025-08-16
-- Description: Add admin dashboard support with enhanced session management and audit logging

-- Create admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS admin;

-- Add new columns to sessions table for admin management
ALTER TABLE auth.sessions 
ADD COLUMN IF NOT EXISTS device_info VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing sessions to have default values
UPDATE auth.sessions 
SET 
    is_active = true,
    last_active_at = created_at
WHERE is_active IS NULL OR last_active_at IS NULL;

-- Create audit_logs table for admin action tracking
CREATE TABLE IF NOT EXISTS admin.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_resource VARCHAR(100),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user_id ON admin.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON admin.audit_logs(target_user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON auth.sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_is_active ON auth.sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active_at ON auth.sessions(last_active_at);

-- Add comments for documentation
COMMENT ON TABLE admin.audit_logs IS 'Audit trail for all admin actions performed in the system';
COMMENT ON COLUMN admin.audit_logs.action IS 'Type of action performed (e.g., user_created, session_terminated)';
COMMENT ON COLUMN admin.audit_logs.admin_user_id IS 'ID of the admin user who performed the action';
COMMENT ON COLUMN admin.audit_logs.target_user_id IS 'ID of the user affected by the action (if applicable)';
COMMENT ON COLUMN admin.audit_logs.target_resource IS 'Type of resource affected (e.g., user, session, dashboard)';
COMMENT ON COLUMN admin.audit_logs.metadata IS 'Additional context data for the action';

COMMENT ON COLUMN auth.sessions.device_info IS 'Device information for session tracking';
COMMENT ON COLUMN auth.sessions.is_active IS 'Whether the session is currently active';
COMMENT ON COLUMN auth.sessions.last_active_at IS 'Timestamp of last activity for this session';