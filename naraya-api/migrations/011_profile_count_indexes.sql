CREATE INDEX IF NOT EXISTS naraya_library_user_status_idx
ON naraya_library_items (user_id, status);
