-- Migration: Add google_id and auth_provider columns to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE NULL,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Reload the Supabase PostgREST schema cache instantly
NOTIFY pgrst, 'reload schema';
