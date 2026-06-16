-- Performance indexes identified during security + scalability audit

-- P0-5: Message history pagination (ordered by created_at, filtered by conversation_id)
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created
  ON direct_messages (conversation_id, created_at DESC);

-- P0-5: "Load older" pagination uses id-based cursor
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id
  ON direct_messages (conversation_id, id);

-- P0-1: Mark-as-read update (conversation_id + receiver_id + is_read)
CREATE INDEX IF NOT EXISTS idx_direct_messages_read_status
  ON direct_messages (conversation_id, receiver_id, is_read)
  WHERE is_read = false;

-- P0-1: Fetch conversation participants
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_receiver
  ON direct_messages (sender_id, receiver_id);

-- Posts: author lookups + community feed
CREATE INDEX IF NOT EXISTS idx_posts_author_id
  ON posts (author_id);

CREATE INDEX IF NOT EXISTS idx_posts_community_created
  ON posts (community_id, created_at DESC);

-- Votes: unique constraint already exists, add index for post-level aggregations
CREATE INDEX IF NOT EXISTS idx_votes_post_vote_type
  ON votes (post_id, vote_type);

-- Referral requests: senior dashboard
CREATE INDEX IF NOT EXISTS idx_referral_requests_senior_status
  ON referral_requests (senior_id, status);

CREATE INDEX IF NOT EXISTS idx_referral_requests_requester_status
  ON referral_requests (requester_id, status);

-- Connections: network queries (incoming/outgoing)
CREATE INDEX IF NOT EXISTS idx_connections_sender_status
  ON connections (sender_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_receiver_status
  ON connections (receiver_id, status);

-- Network discovery: following lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows (follower_id, following_id);

-- Community members: membership lookups
CREATE INDEX IF NOT EXISTS idx_community_members_community
  ON community_members (community_id, user_id);

-- Student groups: active groups by community
CREATE INDEX IF NOT EXISTS idx_student_groups_community_active
  ON student_groups (parent_community_id, is_active)
  WHERE is_active = true;

-- Student group members: membership checks
CREATE INDEX IF NOT EXISTS idx_student_group_members_group_user
  ON student_group_members (group_id, user_id);

-- Answers: post answers ordered by votes/acceptance
CREATE INDEX IF NOT EXISTS idx_answers_post_id
  ON answers (post_id);

-- Rise points log: user history
CREATE INDEX IF NOT EXISTS idx_rise_points_log_user_id
  ON rise_points_log (user_id, created_at DESC);

-- Notifications: feed queries
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_created
  ON notifications (receiver_id, created_at DESC);

-- Blocked users: message permission checks
CREATE INDEX IF NOT EXISTS idx_blocked_users_pair
  ON blocked_users (blocker_id, blocked_id);
