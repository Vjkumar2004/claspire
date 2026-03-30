-- Complete Supabase Structure Migration
-- This migration creates and fixes all necessary tables for the Claspire application
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

-- Users table (enhanced version)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    unique_id TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'senior', 'admin')),
    college_id UUID REFERENCES colleges(id),
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    avatar_url TEXT,
    rise_points INTEGER DEFAULT 0,
    rp_level INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colleges table
CREATE TABLE IF NOT EXISTS colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT,
    location TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communities table (main college communities + sub-groups)
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    college_id UUID REFERENCES colleges(id),
    parent_community_id UUID REFERENCES communities(id), -- null for main college communities
    created_by UUID REFERENCES users(id),
    creator_role TEXT,
    is_private BOOLEAN DEFAULT false,
    is_ephemeral BOOLEAN DEFAULT true,
    auto_delete_at TIMESTAMP WITH TIME ZONE,
    member_count INTEGER DEFAULT 0,
    senior_count INTEGER DEFAULT 0,
    doubt_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- for soft deletes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for slug within parent community
    UNIQUE(slug, parent_community_id)
);

-- Community Members table
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
    membership_type TEXT DEFAULT 'joined' CHECK (membership_type IN ('joined', 'following')),
    is_verified BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only be a member once per community
    UNIQUE(community_id, user_id)
);

-- =====================================================
-- 2. CONTENT TABLES
-- =====================================================

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'doubt' CHECK (type IN ('doubt', 'discussion', 'experience', 'referral_hunt', 'resource')),
    community_id UUID REFERENCES communities(id),
    author_id UUID REFERENCES users(id),
    image_url TEXT,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    is_answered BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    upvote_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_accepted BOOLEAN DEFAULT false,
    upvote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. GROUPS & MESSAGING
-- =====================================================

-- Group Messages table (FIXED: using community_id consistently)
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE, -- Fixed: was group_id
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_deleted_by_sender BOOLEAN DEFAULT false,
    is_deleted_by_receiver BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. JOBS & REFERRALS
-- =====================================================

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    salary_range TEXT,
    location TEXT,
    job_type TEXT DEFAULT 'full_time' CHECK (job_type IN ('full_time', 'part_time', 'internship', 'contract')),
    requirements TEXT[],
    community_id UUID REFERENCES communities(id),
    posted_by UUID REFERENCES users(id),
    referral_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID REFERENCES users(id),
    referrer_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    resume_url TEXT,
    cover_letter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. WEBINARS & EVENTS
-- =====================================================

-- Webinars table
CREATE TABLE IF NOT EXISTS webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    speaker_id UUID REFERENCES users(id),
    community_id UUID REFERENCES communities(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration TEXT, -- e.g., "1 hour", "90 minutes"
    price DECIMAL(10,2) DEFAULT 0,
    max_seats INTEGER,
    registered_count INTEGER DEFAULT 0,
    meeting_url TEXT,
    meeting_id TEXT,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webinar Registrations table
CREATE TABLE IF NOT EXISTS webinar_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES users(id),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only register once per webinar
    UNIQUE(webinar_id, attendee_id)
);

-- =====================================================
-- 6. NOTIFICATIONS & SETTINGS
-- =====================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    referral_notifications BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one settings record per user
    UNIQUE(user_id)
);

-- =====================================================
-- 7. AUTHENTICATION & SECURITY
-- =====================================================

-- OTP Store table
CREATE TABLE IF NOT EXISTS otp_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Reset table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

-- Communities indexes
CREATE INDEX IF NOT EXISTS idx_communities_college ON communities(college_id);
CREATE INDEX IF NOT EXISTS idx_communities_parent ON communities(parent_community_id);
CREATE INDEX IF NOT EXISTS idx_communities_creator ON communities(created_by);
CREATE INDEX IF NOT EXISTS idx_communities_deleted ON communities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug);

-- Community Members indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(role);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);

-- Group Messages indexes
CREATE INDEX IF NOT EXISTS idx_group_messages_community ON group_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_expires ON group_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_community ON jobs(community_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all user-data tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Community Members RLS Policies
CREATE POLICY "Users can view their community memberships" ON community_members FOR SELECT 
USING (user_id = auth.uid() OR 
       community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their community memberships" ON community_members FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their community memberships" ON community_members FOR UPDATE 
USING (user_id = auth.uid());

-- Posts RLS Policies
CREATE POLICY "Users can view posts from their communities" ON posts FOR SELECT 
USING (community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()) OR 
       visibility = 'public');

CREATE POLICY "Users can insert posts in their communities" ON posts FOR INSERT 
WITH CHECK (author_id = auth.uid() AND 
       community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own posts" ON posts FOR UPDATE 
USING (author_id = auth.uid());

-- Group Messages RLS Policies
CREATE POLICY "Users can view group messages from their communities" ON group_messages FOR SELECT 
USING (community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert group messages in their communities" ON group_messages FOR INSERT 
WITH CHECK (sender_id = auth.uid() AND 
       community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own group messages" ON group_messages FOR UPDATE 
USING (sender_id = auth.uid());

-- Messages RLS Policies
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT 
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can insert messages they send" ON messages FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update messages they receive" ON messages FOR UPDATE 
USING (receiver_id = auth.uid());

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE 
USING (user_id = auth.uid());

-- =====================================================
-- 10. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired group messages
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

-- =====================================================
-- 11. REALTIME SETUP
-- =====================================================

-- Enable Realtime for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- 12. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Note: Uncomment these lines if you want to insert sample data
-- This is useful for development and testing

-- Sample college
-- INSERT INTO colleges (id, name, short_name, slug, type, location, state) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'AAA College of Engineering and Technology', 'AAACET', 'aaacet', 'Private', 'Sivakasi', 'Tamil Nadu')
-- ON CONFLICT (id) DO NOTHING;

-- Sample main community for the college
-- INSERT INTO communities (id, display_name, slug, college_id, is_ephemeral, member_count, senior_count) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'AAACET Community', 'aaacet', '550e8400-e29b-41d4-a716-446655440000', false, 0, 0)
-- ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. FINAL VALIDATION
-- =====================================================

-- Update any existing records to ensure consistency
UPDATE communities 
SET 
    is_ephemeral = COALESCE(is_ephemeral, true),
    auto_delete_at = COALESCE(auto_delete_at, NOW() + INTERVAL '7 days'),
    creator_role = COALESCE(creator_role, 'student')
WHERE parent_community_id IS NOT NULL 
AND (is_ephemeral IS NULL OR auto_delete_at IS NULL OR creator_role IS NULL);

-- Ensure all users have settings
INSERT INTO user_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_settings);

COMMIT;

-- Migration completed successfully!
-- You can now run the cron jobs if pg_cron is available:
-- SELECT cron.schedule('delete-expired-group-messages', '0 * * * *', 'SELECT cleanup_expired_group_messages()');
-- SELECT cron.schedule('delete-inactive-groups', '0 9 * * *', 'SELECT cleanup_inactive_groups()');
