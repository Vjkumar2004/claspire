-- Track unique post views (one per logged-in user or anonymous viewer per post)
CREATE TABLE IF NOT EXISTS post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewer_key TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS post_views_user_unique
    ON post_views(post_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS post_views_viewer_unique
    ON post_views(post_id, viewer_key)
    WHERE viewer_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
