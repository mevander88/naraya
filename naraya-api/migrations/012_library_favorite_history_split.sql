ALTER TABLE naraya_library_items
    ALTER COLUMN is_bookmarked SET DEFAULT false;

CREATE INDEX IF NOT EXISTS naraya_library_history_idx
ON naraya_library_items (user_id, status, updated_at DESC);
