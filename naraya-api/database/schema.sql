-- Naraya database schema dump
-- Target: PostgreSQL

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS naraya_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'reader',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL DEFAULT crypt('naraya-demo', gen_salt('bf')),
    CONSTRAINT naraya_users_username_len CHECK (char_length(username) BETWEEN 3 AND 40),
    CONSTRAINT naraya_users_display_name_len CHECK (char_length(display_name) BETWEEN 1 AND 80),
    CONSTRAINT naraya_users_email_format CHECK (email = '' OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS naraya_users_email_unique_idx
ON naraya_users (lower(email))
WHERE email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS naraya_users_username_lower_unique_idx
ON naraya_users (lower(username));

CREATE TABLE IF NOT EXISTS naraya_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES naraya_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS naraya_sessions_user_idx
ON naraya_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS naraya_sessions_active_idx
ON naraya_sessions (token_hash, expires_at)
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_sessions_active_lookup_idx
ON naraya_sessions (token_hash)
INCLUDE (user_id, expires_at)
WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS naraya_user_settings (
    user_id UUID PRIMARY KEY REFERENCES naraya_users(id) ON DELETE CASCADE,
    auto_bookmark BOOLEAN NOT NULL DEFAULT true,
    mature_filter BOOLEAN NOT NULL DEFAULT false,
    high_quality_images BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS naraya_library_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES naraya_users(id) ON DELETE CASCADE,
    comic_slug TEXT NOT NULL,
    comic_title TEXT NOT NULL,
    cover_url TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    latest_chapter_slug TEXT NOT NULL DEFAULT '',
    last_chapter_slug TEXT NOT NULL DEFAULT '',
    last_chapter_title TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'reading',
    progress_percent INTEGER NOT NULL DEFAULT 0,
    is_bookmarked BOOLEAN NOT NULL DEFAULT false,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at TIMESTAMPTZ,
    content_kind TEXT NOT NULL DEFAULT 'comic',
    CONSTRAINT naraya_library_progress_range CHECK (progress_percent BETWEEN 0 AND 100),
    CONSTRAINT naraya_library_status_allowed CHECK (status IN ('reading', 'planned', 'completed', 'paused', 'dropped')),
    CONSTRAINT naraya_library_content_kind_allowed CHECK (content_kind IN ('comic', 'series')),
    CONSTRAINT naraya_library_unique_user_comic UNIQUE (user_id, comic_slug)
);

CREATE INDEX IF NOT EXISTS naraya_library_user_updated_idx
ON naraya_library_items (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS naraya_library_bookmark_idx
ON naraya_library_items (user_id, is_bookmarked, updated_at DESC);

CREATE INDEX IF NOT EXISTS naraya_library_user_kind_updated_idx
ON naraya_library_items (user_id, content_kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS naraya_library_user_status_idx
ON naraya_library_items (user_id, status);

CREATE TABLE IF NOT EXISTS naraya_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES naraya_users(id) ON DELETE CASCADE,
    comic_slug TEXT NOT NULL DEFAULT '',
    chapter_slug TEXT NOT NULL DEFAULT '',
    parent_id UUID REFERENCES naraya_comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT naraya_comments_target_required CHECK (comic_slug <> '' OR chapter_slug <> ''),
    CONSTRAINT naraya_comments_body_len CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS naraya_comments_comic_idx
ON naraya_comments (comic_slug, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_chapter_idx
ON naraya_comments (chapter_slug, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_comic_chapter_idx
ON naraya_comments (comic_slug, chapter_slug, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_target_root_cursor_idx
ON naraya_comments (comic_slug, chapter_slug, created_at DESC, id DESC)
WHERE deleted_at IS NULL AND parent_id IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_chapter_root_cursor_idx
ON naraya_comments (chapter_slug, created_at DESC, id DESC)
WHERE deleted_at IS NULL AND parent_id IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_parent_idx
ON naraya_comments (parent_id, created_at ASC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_parent_latest_idx
ON naraya_comments (parent_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_user_created_idx
ON naraya_comments (user_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS naraya_comments_user_cursor_idx
ON naraya_comments (user_id, created_at DESC, id DESC)
WHERE deleted_at IS NULL;

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

CREATE INDEX IF NOT EXISTS naraya_love_target_user_idx
ON naraya_love_items (target_slug, user_id);

CREATE INDEX IF NOT EXISTS naraya_love_user_created_idx
ON naraya_love_items (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS naraya_love_counts (
    target_slug TEXT PRIMARY KEY,
    love_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT naraya_love_counts_non_negative CHECK (love_count >= 0)
);

CREATE OR REPLACE FUNCTION naraya_love_counts_increment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO naraya_love_counts (target_slug, love_count, updated_at)
    VALUES (NEW.target_slug, 1, now())
    ON CONFLICT (target_slug) DO UPDATE SET
        love_count = naraya_love_counts.love_count + 1,
        updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION naraya_love_counts_decrement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE naraya_love_counts
    SET love_count = GREATEST(love_count - 1, 0),
        updated_at = now()
    WHERE target_slug = OLD.target_slug;

    DELETE FROM naraya_love_counts
    WHERE target_slug = OLD.target_slug
      AND love_count = 0;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS naraya_love_counts_increment_trigger ON naraya_love_items;
CREATE TRIGGER naraya_love_counts_increment_trigger
AFTER INSERT ON naraya_love_items
FOR EACH ROW
EXECUTE FUNCTION naraya_love_counts_increment();

DROP TRIGGER IF EXISTS naraya_love_counts_decrement_trigger ON naraya_love_items;
CREATE TRIGGER naraya_love_counts_decrement_trigger
AFTER DELETE ON naraya_love_items
FOR EACH ROW
EXECUTE FUNCTION naraya_love_counts_decrement();

INSERT INTO naraya_users (id, username, display_name, avatar_url, bio, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'nara_reader',
    'Nara Reader',
    'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80',
    'Akun pembaca Naraya.',
    'reader'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO naraya_user_settings (user_id)
SELECT id FROM naraya_users
ON CONFLICT (user_id) DO NOTHING;
