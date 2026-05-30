CREATE TABLE IF NOT EXISTS naraya_favorite_counts (
    target_slug TEXT PRIMARY KEY,
    favorite_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT naraya_favorite_counts_non_negative CHECK (favorite_count >= 0)
);

INSERT INTO naraya_favorite_counts (target_slug, favorite_count, updated_at)
SELECT comic_slug, count(*)::bigint, now()
FROM naraya_library_items
WHERE is_bookmarked = true
GROUP BY comic_slug
ON CONFLICT (target_slug) DO UPDATE SET
    favorite_count = EXCLUDED.favorite_count,
    updated_at = now();

CREATE INDEX IF NOT EXISTS naraya_library_favorite_target_user_idx
ON naraya_library_items (comic_slug, user_id)
WHERE is_bookmarked = true;

CREATE OR REPLACE FUNCTION naraya_favorite_counts_increment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_bookmarked = true THEN
        INSERT INTO naraya_favorite_counts (target_slug, favorite_count, updated_at)
        VALUES (NEW.comic_slug, 1, now())
        ON CONFLICT (target_slug) DO UPDATE SET
            favorite_count = naraya_favorite_counts.favorite_count + 1,
            updated_at = now();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION naraya_favorite_counts_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_bookmarked IS DISTINCT FROM NEW.is_bookmarked THEN
        IF NEW.is_bookmarked = true THEN
            INSERT INTO naraya_favorite_counts (target_slug, favorite_count, updated_at)
            VALUES (NEW.comic_slug, 1, now())
            ON CONFLICT (target_slug) DO UPDATE SET
                favorite_count = naraya_favorite_counts.favorite_count + 1,
                updated_at = now();
        ELSIF OLD.is_bookmarked = true THEN
            UPDATE naraya_favorite_counts
            SET favorite_count = GREATEST(favorite_count - 1, 0),
                updated_at = now()
            WHERE target_slug = OLD.comic_slug;

            DELETE FROM naraya_favorite_counts
            WHERE target_slug = OLD.comic_slug
              AND favorite_count = 0;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION naraya_favorite_counts_decrement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.is_bookmarked = true THEN
        UPDATE naraya_favorite_counts
        SET favorite_count = GREATEST(favorite_count - 1, 0),
            updated_at = now()
        WHERE target_slug = OLD.comic_slug;

        DELETE FROM naraya_favorite_counts
        WHERE target_slug = OLD.comic_slug
          AND favorite_count = 0;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS naraya_favorite_counts_increment_trigger ON naraya_library_items;
CREATE TRIGGER naraya_favorite_counts_increment_trigger
AFTER INSERT ON naraya_library_items
FOR EACH ROW
EXECUTE FUNCTION naraya_favorite_counts_increment();

DROP TRIGGER IF EXISTS naraya_favorite_counts_update_trigger ON naraya_library_items;
CREATE TRIGGER naraya_favorite_counts_update_trigger
AFTER UPDATE OF is_bookmarked ON naraya_library_items
FOR EACH ROW
EXECUTE FUNCTION naraya_favorite_counts_update();

DROP TRIGGER IF EXISTS naraya_favorite_counts_decrement_trigger ON naraya_library_items;
CREATE TRIGGER naraya_favorite_counts_decrement_trigger
AFTER DELETE ON naraya_library_items
FOR EACH ROW
EXECUTE FUNCTION naraya_favorite_counts_decrement();
