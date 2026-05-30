CREATE UNIQUE INDEX IF NOT EXISTS naraya_users_username_lower_unique_idx
ON naraya_users (lower(username));

CREATE INDEX IF NOT EXISTS naraya_sessions_active_lookup_idx
ON naraya_sessions (token_hash)
INCLUDE (user_id, expires_at)
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_comic_chapter_idx
ON naraya_comments (comic_slug, chapter_slug, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_user_created_idx
ON naraya_comments (user_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_love_target_user_idx
ON naraya_love_items (target_slug, user_id);
