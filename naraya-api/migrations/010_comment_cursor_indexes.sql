CREATE INDEX IF NOT EXISTS naraya_comments_target_root_cursor_idx
ON naraya_comments (comic_slug, chapter_slug, created_at DESC, id DESC)
WHERE deleted_at IS NULL AND parent_id IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_chapter_root_cursor_idx
ON naraya_comments (chapter_slug, created_at DESC, id DESC)
WHERE deleted_at IS NULL AND parent_id IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_user_cursor_idx
ON naraya_comments (user_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_parent_latest_idx
ON naraya_comments (parent_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;
