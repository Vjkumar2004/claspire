-- Student Groups Feature Migration
-- Run this migration in your Supabase SQL editor

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for group_messages
CREATE INDEX IF NOT EXISTS idx_group_messages_community ON group_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_expires ON group_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);

-- Add creator_role to communities table
ALTER TABLE communities ADD COLUMN IF NOT EXISTS creator_role TEXT;

-- Add auto_delete_at to communities table
ALTER TABLE communities ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP WITH TIME ZONE;

-- Add is_ephemeral to communities table (for message auto-deletion)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_ephemeral BOOLEAN DEFAULT true;

-- Function to clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_group_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM group_messages 
    WHERE expires_at < NOW() AND is_deleted = false;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up inactive groups
CREATE OR REPLACE FUNCTION cleanup_inactive_groups()
RETURNS void AS $$
BEGIN
    DELETE FROM communities 
    WHERE parent_community_id IS NOT NULL
    AND last_activity_at < NOW() - INTERVAL '7 days'
    AND is_ephemeral = true;
END;
$$ LANGUAGE plpgsql;

-- Note: These cron jobs require pg_cron extension in Supabase
-- Uncomment and run these in Supabase if pg_cron is available:

-- Auto delete expired messages every hour
-- SELECT cron.schedule(
--   'delete-expired-group-messages',
--   '0 * * * *',
--   'SELECT cleanup_expired_group_messages()'
-- );

-- Auto delete inactive groups daily at 9 AM
-- SELECT cron.schedule(
--   'delete-inactive-groups',
--   '0 9 * * *',
--   'SELECT cleanup_inactive_groups()'
-- );

-- Update existing groups to have proper defaults
UPDATE communities 
SET 
    is_ephemeral = true,
    auto_delete_at = NOW() + INTERVAL '7 days',
    creator_role = 'student'
WHERE parent_community_id IS NOT NULL 
AND (is_ephemeral IS NULL OR auto_delete_at IS NULL);

-- Add RLS policies for group_messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from communities they are members of
CREATE POLICY "Users can view group messages from their communities"
ON group_messages FOR SELECT
USING (
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can insert messages in communities they are members of
CREATE POLICY "Users can insert group messages in their communities"
ON group_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
);

-- Policy: Users can update their own messages (for deletion)
CREATE POLICY "Users can update their own group messages"
ON group_messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());
