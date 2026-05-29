ALTER TABLE naraya_users
ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT crypt('naraya-demo', gen_salt('bf'));

CREATE UNIQUE INDEX IF NOT EXISTS naraya_users_email_unique_idx
ON naraya_users (lower(email))
WHERE email <> '';

ALTER TABLE naraya_users
DROP CONSTRAINT IF EXISTS naraya_users_email_format;

ALTER TABLE naraya_users
ADD CONSTRAINT naraya_users_email_format
CHECK (email = '' OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$');

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

CREATE INDEX IF NOT EXISTS naraya_sessions_user_idx ON naraya_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS naraya_sessions_active_idx ON naraya_sessions (token_hash, expires_at) WHERE revoked_at IS NULL;
