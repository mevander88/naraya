CREATE TABLE IF NOT EXISTS naraya_love_counts (
    target_slug TEXT PRIMARY KEY,
    love_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT naraya_love_counts_non_negative CHECK (love_count >= 0)
);

INSERT INTO naraya_love_counts (target_slug, love_count, updated_at)
SELECT target_slug, count(*)::bigint, now()
FROM naraya_love_items
GROUP BY target_slug
ON CONFLICT (target_slug) DO UPDATE SET
    love_count = EXCLUDED.love_count,
    updated_at = now();

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

ALTER TABLE naraya_sessions SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_analyze_scale_factor = 0.01
);

ALTER TABLE naraya_library_items SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE naraya_comments SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE naraya_love_items SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE naraya_user_settings SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);
