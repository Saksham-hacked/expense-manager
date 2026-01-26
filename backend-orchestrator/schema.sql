-- Backend Orchestrator Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ========================================
-- IMPORTANT: This database stores ONLY:
-- 1. User identity metadata (Google OAuth)
-- 2. Encrypted LLM API keys (BYOK)
--
-- Expense data lives in the MCP server DB
-- ========================================

-- Users Table
-- Stores Google OAuth identity information
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,           -- Google OAuth "sub" claim
    email TEXT NOT NULL,                -- User's email from Google
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User LLM Keys Table
-- Stores encrypted BYOK API keys for LLM providers
CREATE TABLE IF NOT EXISTS user_llm_keys (
    user_id TEXT PRIMARY KEY,           -- References users.user_id
    provider TEXT NOT NULL,             -- "gemini" | "openai"
    encrypted_key TEXT NOT NULL,        -- AES-256-GCM encrypted API key
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_user_llm_keys_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    
    -- Ensure provider is valid
    CONSTRAINT chk_provider
        CHECK (provider IN ('gemini', 'openai'))
);

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================
-- Note: Backend uses service role key, so RLS is optional
-- But good practice for additional security layer

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_llm_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to users"
    ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to user_llm_keys"
    ON user_llm_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ========================================
-- Helpful Functions
-- ========================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on user_llm_keys
DROP TRIGGER IF EXISTS update_user_llm_keys_updated_at ON user_llm_keys;
CREATE TRIGGER update_user_llm_keys_updated_at
    BEFORE UPDATE ON user_llm_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Verification Queries
-- ========================================
-- Run these to verify schema is correct:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check users table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Check user_llm_keys table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_llm_keys';

-- ========================================
-- Example Data (for testing only)
-- ========================================
-- Uncomment to insert test data:

-- INSERT INTO users (user_id, email) VALUES
--     ('test_user_123', 'test@example.com');

-- INSERT INTO user_llm_keys (user_id, provider, encrypted_key) VALUES
--     ('test_user_123', 'gemini', 'encrypted_test_key_here');
