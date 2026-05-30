CREATE TABLE IF NOT EXISTS naraya_user_settings (
    user_id UUID PRIMARY KEY REFERENCES naraya_users(id) ON DELETE CASCADE,
    auto_bookmark BOOLEAN NOT NULL DEFAULT true,
    mature_filter BOOLEAN NOT NULL DEFAULT false,
    high_quality_images BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO naraya_user_settings (user_id)
SELECT id FROM naraya_users
ON CONFLICT (user_id) DO NOTHING;
