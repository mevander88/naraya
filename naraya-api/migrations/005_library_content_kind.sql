ALTER TABLE naraya_library_items
ADD COLUMN IF NOT EXISTS content_kind TEXT NOT NULL DEFAULT 'comic';

ALTER TABLE naraya_library_items
DROP CONSTRAINT IF EXISTS naraya_library_content_kind_allowed;

ALTER TABLE naraya_library_items
ADD CONSTRAINT naraya_library_content_kind_allowed CHECK (content_kind IN ('comic', 'series'));

CREATE INDEX IF NOT EXISTS naraya_library_user_kind_updated_idx
ON naraya_library_items (user_id, content_kind, updated_at DESC);
