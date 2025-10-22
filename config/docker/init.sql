-- Locod.AI v2.0 Database Initialization
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS sites;
CREATE SCHEMA IF NOT EXISTS queue;

-- Set search path
SET search_path TO public, auth, sites, queue;

-- Users table
CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (extends users)
CREATE TABLE auth.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    site_quota INTEGER DEFAULT 1,
    storage_quota_mb INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites table
CREATE TABLE sites.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id VARCHAR(100) UNIQUE NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    business_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'created',
    config JSONB,
    deployment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_at TIMESTAMPTZ,
    build_logs TEXT
);

-- Templates table
CREATE TABLE sites.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    business_types TEXT[],
    config JSONB,
    preview_image VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Queue table
CREATE TABLE queue.ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id),
    site_id UUID REFERENCES sites.sites(id),
    request_type VARCHAR(50) NOT NULL,
    request_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id),
    priority INTEGER DEFAULT 5,
    prompt TEXT,
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Sessions table
CREATE TABLE auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    refresh_token VARCHAR(500) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification tokens table for password reset and email verification
CREATE TABLE auth.verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_sites_customer ON sites.sites(customer_id);
CREATE INDEX idx_sites_status ON sites.sites(status);
CREATE INDEX idx_ai_requests_status ON queue.ai_requests(status);
CREATE INDEX idx_ai_requests_customer ON queue.ai_requests(customer_id);
CREATE INDEX idx_sessions_token ON auth.sessions(token);
CREATE INDEX idx_sessions_user ON auth.sessions(user_id);
CREATE INDEX idx_verification_tokens_token ON auth.verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_type ON auth.verification_tokens(user_id, token_type);
CREATE INDEX idx_verification_tokens_expires ON auth.verification_tokens(expires_at);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- Create default admin user
-- To generate password hash: node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your_password', 10));"
-- Default password: admin123 (CHANGE IN PRODUCTION!)
-- This hash is for 'admin123': $2b$10$rBx3Q.XhInLTfRGBJkcBiOURu1Bp4h7zHGOX0D1tsQkQtyZDKPLlG
INSERT INTO auth.users (email, password_hash, first_name, last_name, role, is_active, email_verified)
VALUES ('admin@locod.ai', '$2b$10$rBx3Q.XhInLTfRGBJkcBiOURu1Bp4h7zHGOX0D1tsQkQtyZDKPLlG', 'Admin', 'User', 'admin', true, true);

-- Create default templates
INSERT INTO sites.templates (name, display_name, description, business_types, config)
VALUES 
    ('template-base', 'Template de Base', 'Template standard pour tous types de business', 
     ARRAY['general'], '{"version": "2.0"}'::jsonb),
    ('translation-pro', 'Translation Professional', 'Template pour services de traduction',
     ARRAY['translation', 'language-services'], '{"version": "2.0"}'::jsonb),
    ('education', 'Education & Training', 'Template pour établissements éducatifs',
     ARRAY['education', 'training', 'course'], '{"version": "2.0"}'::jsonb);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites.sites 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_tokens_updated_at BEFORE UPDATE ON auth.verification_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();