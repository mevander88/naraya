CREATE TABLE IF NOT EXISTS naraya_love_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES naraya_users(id) ON DELETE CASCADE,
    target_slug TEXT NOT NULL,
    target_title TEXT NOT NULL,
    content_kind TEXT NOT NULL DEFAULT 'comic',
    cover_url TEXT NOT NULL DEFAULT '',
    target_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT naraya_love_target_required CHECK (target_slug <> ''),
    CONSTRAINT naraya_love_content_kind_allowed CHECK (content_kind IN ('comic', 'series')),
    CONSTRAINT naraya_love_unique_user_target UNIQUE (user_id, target_slug)
);

CREATE INDEX IF NOT EXISTS naraya_love_target_idx
ON naraya_love_items (target_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS naraya_love_user_created_idx
ON naraya_love_items (user_id, created_at DESC);
