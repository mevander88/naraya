ALTER TABLE naraya_library_items
ADD COLUMN IF NOT EXISTS progress_completed INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS progress_total INTEGER NOT NULL DEFAULT 0;

ALTER TABLE naraya_library_items
DROP CONSTRAINT IF EXISTS naraya_library_progress_completed_range;

ALTER TABLE naraya_library_items
ADD CONSTRAINT naraya_library_progress_completed_range CHECK (progress_completed >= 0);

ALTER TABLE naraya_library_items
DROP CONSTRAINT IF EXISTS naraya_library_progress_total_range;

ALTER TABLE naraya_library_items
ADD CONSTRAINT naraya_library_progress_total_range CHECK (progress_total >= 0);

CREATE TABLE IF NOT EXISTS naraya_library_progress_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES naraya_users(id) ON DELETE CASCADE,
    comic_slug TEXT NOT NULL,
    content_kind TEXT NOT NULL DEFAULT 'comic',
    chapter_slug TEXT NOT NULL,
    chapter_title TEXT NOT NULL DEFAULT '',
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT naraya_library_progress_kind_allowed CHECK (content_kind IN ('comic', 'series')),
    CONSTRAINT naraya_library_progress_target_required CHECK (comic_slug <> '' AND chapter_slug <> ''),
    CONSTRAINT naraya_library_progress_unique UNIQUE (user_id, comic_slug, chapter_slug)
);

CREATE INDEX IF NOT EXISTS naraya_library_progress_user_comic_idx
ON naraya_library_progress_items (user_id, comic_slug, read_at DESC);

CREATE INDEX IF NOT EXISTS naraya_library_progress_user_updated_idx
ON naraya_library_progress_items (user_id, updated_at DESC, id DESC);

INSERT INTO naraya_library_progress_items (
    user_id, comic_slug, content_kind, chapter_slug, chapter_title, read_at, created_at, updated_at
)
SELECT user_id, comic_slug, COALESCE(NULLIF(content_kind, ''), 'comic'), last_chapter_slug, last_chapter_title,
       COALESCE(last_read_at, updated_at), COALESCE(last_read_at, updated_at), updated_at
FROM naraya_library_items
WHERE last_chapter_slug <> ''
  AND (status <> 'planned' OR progress_percent > 0)
ON CONFLICT (user_id, comic_slug, chapter_slug) DO NOTHING;

UPDATE naraya_library_items item
SET progress_completed = progress.count_value,
    progress_total = GREATEST(item.progress_total, progress.count_value)
FROM (
    SELECT user_id, comic_slug, count(*)::int AS count_value
    FROM naraya_library_progress_items
    GROUP BY user_id, comic_slug
) progress
WHERE item.user_id = progress.user_id
  AND item.comic_slug = progress.comic_slug
  AND item.progress_completed = 0;
