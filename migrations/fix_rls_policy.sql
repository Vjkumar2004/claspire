-- Fix RLS policy for student_groups table
-- The current policy is too restrictive and blocking inserts

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create groups in their college" ON student_groups;

-- Create a more permissive policy for inserts
CREATE POLICY "Users can create groups in their college" ON student_groups FOR INSERT 
WITH CHECK (
  created_by = auth.uid()
);

-- Also fix the view policy to be more permissive
DROP POLICY IF EXISTS "Users can view groups from their college" ON student_groups;

CREATE POLICY "Users can view groups from their college" ON student_groups FOR SELECT 
USING (
  created_by = auth.uid() OR
  college_id IN (SELECT college_id FROM users WHERE id = auth.uid())
);

-- Fix update policy
DROP POLICY IF EXISTS "Users can update their own groups" ON student_groups;

CREATE POLICY "Users can update their own groups" ON student_groups FOR UPDATE 
USING (created_by = auth.uid());

-- Fix delete policy  
DROP POLICY IF EXISTS "Users can delete their own groups" ON student_groups;

CREATE POLICY "Users can delete their own groups" ON student_groups FOR DELETE 
USING (created_by = auth.uid());
