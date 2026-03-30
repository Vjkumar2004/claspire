-- Create student_group_messages table
CREATE TABLE IF NOT EXISTS student_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES student_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for student_group_messages
CREATE INDEX IF NOT EXISTS idx_student_group_messages_group ON student_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_student_group_messages_sender ON student_group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_student_group_messages_created ON student_group_messages(created_at DESC);

-- Enable RLS for student group messages
ALTER TABLE student_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student group messages
CREATE POLICY "Users can view student group messages they are members of" ON student_group_messages FOR SELECT 
USING (
    group_id IN (
        SELECT group_id FROM student_group_members 
        WHERE user_id = auth.uid()
    ) OR
    group_id IN (
        SELECT id FROM student_groups 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can insert student group messages they are members of" ON student_group_messages FOR INSERT 
WITH CHECK (
    group_id IN (
        SELECT group_id FROM student_group_members 
        WHERE user_id = auth.uid()
    ) OR
    group_id IN (
        SELECT id FROM student_groups 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can update their own student group messages" ON student_group_messages FOR UPDATE 
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own student group messages" ON student_group_messages FOR DELETE 
USING (sender_id = auth.uid());

-- Add realtime for student group messages
ALTER PUBLICATION supabase_realtime ADD TABLE student_group_messages;
