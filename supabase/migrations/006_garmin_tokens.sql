-- Singleton table for persisting Garmin OAuth tokens across Railway restarts.
-- Single row (id = 1). loadToken() on startup avoids re-authenticating with credentials.
CREATE TABLE IF NOT EXISTS garmin_tokens (
  id           INTEGER PRIMARY KEY DEFAULT 1,
  oauth1_token JSONB NOT NULL,
  oauth2_token JSONB NOT NULL,
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grant service_role and authenticated full access (needed for Railway server reads/writes)
GRANT ALL ON garmin_tokens TO service_role, authenticated;

-- Block anon key from reading the token (same pattern as auth_tokens)
REVOKE SELECT ON garmin_tokens FROM anon;
