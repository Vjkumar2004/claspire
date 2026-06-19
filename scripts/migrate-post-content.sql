-- Find affected posts (dry run)
SELECT id, LEFT(content, 200) AS content_preview
FROM posts
WHERE content ~* 'data-conversation-screenshot-content|markdown prose|text-message|agent-turn|class="[^"]*text-base|data-testid'
ORDER BY created_at DESC;

-- Count affected
SELECT COUNT(*) AS total_affected
FROM posts
WHERE content ~* 'data-conversation-screenshot-content|markdown prose|text-message|agent-turn|class="[^"]*text-base|data-testid';

-- Step 1: Remove ChatGPT wrapper divs
UPDATE posts
SET content = regexp_replace(content, '<div[^>]*data-conversation-screenshot-content[^>]*>', '', 'gi')
WHERE content ~* 'data-conversation-screenshot-content';

UPDATE posts
SET content = regexp_replace(content, '</div>\s*$', '', 'gi')
WHERE content ~* 'data-conversation-screenshot-content';

-- Step 2: Remove markdown prose wrapper divs
UPDATE posts
SET content = regexp_replace(content, '<div[^>]*class="[^"]*markdown[^"]*prose[^"]*"[^>]*>', '', 'gi')
WHERE content ~* 'markdown prose';

-- Step 3: Remove text-message and agent-turn wrapper divs
UPDATE posts
SET content = regexp_replace(content, '<div[^>]*(text-message|agent-turn)[^>]*>', '', 'gi')
WHERE content ~* 'text-message|agent-turn';

-- Step 4: Remove remaining data-* attributes
UPDATE posts
SET content = regexp_replace(content, '\s+data-[\w-]+="[^"]*"', '', 'gi');

-- Step 5: Remove remaining class attributes
UPDATE posts
SET content = regexp_replace(content, '\s+class="[^"]*"', '', 'gi');

-- Step 6: Remove empty wrapper divs (after class/data removal)
UPDATE posts
SET content = regexp_replace(content, '<div>\s*</div>', '', 'gi');

-- Step 7: Convert remaining divs to paragraphs
UPDATE posts
SET content = regexp_replace(content, '<div>', '<p>', 'gi');
UPDATE posts
SET content = regexp_replace(content, '</div>', '</p>', 'gi');

-- Step 8: Remove stray </div> tags that had no opening
UPDATE posts
SET content = regexp_replace(content, '</div>', '', 'gi');

-- NOTE: SQL regex can only do so much.
-- Run the Node.js migration script for full sanitization:
-- npx tsx scripts/migrate-post-content.ts
