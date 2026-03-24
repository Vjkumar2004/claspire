-- Add password reset fields to users table
-- Run this migration in your Supabase SQL editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_otp TEXT,
ADD COLUMN IF NOT EXISTS reset_otp_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);
CREATE INDEX IF NOT EXISTS idx_users_reset_otp_expiry ON users(reset_otp_expiry);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token_expiry ON users(reset_token_expiry);

-- Optional: Create a function to clean up expired tokens and OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_reset_data()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET reset_otp = NULL, reset_otp_expiry = NULL 
    WHERE reset_otp_expiry < NOW();
    
    UPDATE users 
    SET reset_token = NULL, reset_token_expiry = NULL 
    WHERE reset_token_expiry < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to cleanup expired data daily
-- Note: This requires pg_cron extension in Supabase
-- SELECT cron.schedule('cleanup-expired-reset-data', '0 2 * * *', 'SELECT cleanup_expired_reset_data();');
