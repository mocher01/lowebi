-- Add verification tokens table for password reset and email verification

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

-- Create indexes for performance
CREATE INDEX idx_verification_tokens_token ON auth.verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_type ON auth.verification_tokens(user_id, token_type);
CREATE INDEX idx_verification_tokens_expires ON auth.verification_tokens(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_verification_tokens_updated_at 
    BEFORE UPDATE ON auth.verification_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();