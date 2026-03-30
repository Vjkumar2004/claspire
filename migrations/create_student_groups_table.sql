-- Create separate table for student groups
-- This fixes the duplicate college_id constraint issue

CREATE TABLE IF NOT EXISTS student_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    college_id UUID REFERENCES colleges(id),
    parent_community_id UUID REFERENCES communities(id), -- Link to main college community
    created_by UUID REFERENCES users(id),
    member_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    auto_delete_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for slug within college
    UNIQUE(slug, college_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_groups_college ON student_groups(college_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_creator ON student_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_student_groups_parent ON student_groups(parent_community_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_slug ON student_groups(slug);

-- Enable RLS
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view groups from their college" ON student_groups FOR SELECT 
USING (college_id IN (SELECT college_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create groups in their college" ON student_groups FOR INSERT 
WITH CHECK (
    created_by = auth.uid() AND 
    college_id IN (SELECT college_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own groups" ON student_groups FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own groups" ON student_groups FOR DELETE 
USING (created_by = auth.uid());

-- Create student group members table
CREATE TABLE IF NOT EXISTS student_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES student_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only be a member once per group
    UNIQUE(group_id, user_id)
);

-- Enable RLS for group members
ALTER TABLE student_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group members
CREATE POLICY "Users can view group memberships" ON student_group_members FOR SELECT 
USING (
    group_id IN (SELECT id FROM student_groups WHERE college_id IN (SELECT college_id FROM users WHERE id = auth.uid())) OR
    user_id = auth.uid()
);

CREATE POLICY "Users can join groups in their college" ON student_group_members FOR INSERT 
WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (SELECT id FROM student_groups WHERE college_id IN (SELECT college_id FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Users can leave their own memberships" ON student_group_members FOR DELETE 
USING (user_id = auth.uid());

-- Create indexes for group members
CREATE INDEX IF NOT EXISTS idx_student_group_members_group ON student_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_student_group_members_user ON student_group_members(user_id);
