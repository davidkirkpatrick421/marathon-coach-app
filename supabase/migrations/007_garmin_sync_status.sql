-- Singleton row tracking the last Garmin sync attempt.
-- Upserted by the server after every syncGarminRecent call (success or failure).
-- id is always 1 — this is intentionally a single-row status table.
CREATE TABLE garmin_sync_status (
  id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_attempted_at   TIMESTAMPTZ,
  last_succeeded_at   TIMESTAMPTZ,
  last_error          TEXT
);

INSERT INTO garmin_sync_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Dashboard (anon key) needs to read this to show staleness warnings.
GRANT SELECT ON garmin_sync_status TO anon;
-- Server writes via service key — no explicit grant needed (service role bypasses RLS).
