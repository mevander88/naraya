CREATE INDEX IF NOT EXISTS naraya_library_user_updated_cursor_idx
ON naraya_library_items (user_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS naraya_library_favorite_kind_cursor_idx
ON naraya_library_items (user_id, content_kind, updated_at DESC, id DESC)
WHERE is_bookmarked = true;

CREATE INDEX IF NOT EXISTS naraya_library_history_kind_status_cursor_idx
ON naraya_library_items (user_id, content_kind, status, updated_at DESC, id DESC)
WHERE status <> 'planned' OR progress_percent > 0;
