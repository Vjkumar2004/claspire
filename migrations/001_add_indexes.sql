-- Add missing database indexes for query performance

-- connections: filter by receiver_id + status (incoming requests count)
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id_status ON public.connections (receiver_id, status);

-- connections: filter by sender_id + status (outgoing requests count)
CREATE INDEX IF NOT EXISTS idx_connections_sender_id_status ON public.connections (sender_id, status);

-- connections: unique pair lookup (duplicate check)
CREATE INDEX IF NOT EXISTS idx_connections_sender_id_receiver_id ON public.connections (sender_id, receiver_id);

-- notifications: order by receiver_id + created_at (notification list)
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id_created_at ON public.notifications (receiver_id, created_at DESC);

-- notifications: filter by receiver_id + is_read (unread count)
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id_is_read ON public.notifications (receiver_id, is_read);

-- student_group_messages: order by group_id + created_at (message list)
CREATE INDEX IF NOT EXISTS idx_student_group_messages_group_id_created_at ON public.student_group_messages (group_id, created_at DESC);

-- student_group_members: filter by user_id (membership lookup)
CREATE INDEX IF NOT EXISTS idx_student_group_members_user_id ON public.student_group_members (user_id);

-- posts: filter by community_id + visibility + created_at (feed queries)
CREATE INDEX IF NOT EXISTS idx_posts_community_id_visibility_created_at ON public.posts (community_id, visibility, created_at DESC);

-- users: filter by college_id + role (network discovery)
CREATE INDEX IF NOT EXISTS idx_users_college_id_role ON public.users (college_id, role);

-- follows: filter by follower_id (following list)
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows (follower_id);

-- direct_messages: order by conversation_id + created_at (chat history)
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id_created_at ON public.direct_messages (conversation_id, created_at DESC);

-- direct_messages: filter by receiver_id + is_read (unread count)
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id_is_read ON public.direct_messages (receiver_id, is_read);
