ALTER TABLE naraya_library_items
ADD COLUMN IF NOT EXISTS content_status TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS naraya_library_favorite_content_status_idx
ON naraya_library_items (user_id, content_kind, content_status, updated_at DESC, id DESC)
WHERE is_bookmarked = true;
