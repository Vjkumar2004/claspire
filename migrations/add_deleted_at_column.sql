-- Add deleted_at column to communities table
-- This column is used for soft deletes in the groups system

ALTER TABLE communities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_communities_deleted_at ON communities(deleted_at);

-- Update existing groups to ensure they don't appear as deleted
UPDATE communities 
SET deleted_at = NULL 
WHERE deleted_at IS NULL AND parent_community_id IS NOT NULL;
