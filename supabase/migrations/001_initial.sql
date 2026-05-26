-- Auth tokens (single row — personal app)
CREATE TABLE IF NOT EXISTS auth_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expires_at    BIGINT  NOT NULL,
  athlete_id    BIGINT  UNIQUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Training plan phases
CREATE TABLE IF NOT EXISTS plan_phases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL,
  name         TEXT    NOT NULL,
  start_date   DATE    NOT NULL,
  end_date     DATE    NOT NULL,
  goal         TEXT,
  active       BOOLEAN DEFAULT false
);

-- Week by week plan targets
CREATE TABLE IF NOT EXISTS plan_weeks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number         INTEGER NOT NULL,
  phase_id            UUID REFERENCES plan_phases(id),
  run1_target_km      DECIMAL,
  run2_target_km      DECIMAL,
  long_run_target_km  DECIMAL,
  total_target_km     DECIMAL,
  gym_session         TEXT,
  cycling_target_km   DECIMAL,
  is_deload           BOOLEAN DEFAULT false,
  notes               TEXT
);

-- Strava activities (auto-synced via webhook)
CREATE TABLE IF NOT EXISTS activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_id        BIGINT UNIQUE NOT NULL,
  activity_type    TEXT    NOT NULL,
  date             TIMESTAMP WITH TIME ZONE NOT NULL,
  distance_km      DECIMAL,
  duration_seconds INTEGER,
  avg_pace_per_km  DECIMAL,
  avg_hr           INTEGER,
  max_hr           INTEGER,
  avg_cadence      INTEGER,
  elevation_gain   INTEGER,
  calories         INTEGER,
  week_number      INTEGER,
  raw_data         JSONB
);

-- Garmin metrics (manual input or FIT file)
CREATE TABLE IF NOT EXISTS garmin_metrics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                 DATE NOT NULL UNIQUE,
  resting_hr           INTEGER,
  hrv_status           TEXT,
  hrv_7day_avg         INTEGER,
  sleep_score          INTEGER,
  sleep_duration_hrs   DECIMAL,
  body_battery_morning INTEGER
);

-- Weekly qualitative check-ins
CREATE TABLE IF NOT EXISTS checkins (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number            INTEGER NOT NULL,
  date                   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  calf_status            TEXT,
  knee_status            TEXT,
  energy_level           INTEGER,
  motivation_level       INTEGER,
  avg_sleep_score        INTEGER,
  avg_sleep_hrs          DECIMAL,
  session_feedback       TEXT,
  coaching_questions     TEXT,
  plan_adjustment_made   BOOLEAN DEFAULT false,
  plan_adjustment_notes  TEXT
);

-- Log of plan adjustments over time
CREATE TABLE IF NOT EXISTS plan_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            TIMESTAMP WITH TIME ZONE DEFAULT now(),
  week_number     INTEGER,
  adjustment_type TEXT,
  original_plan   TEXT,
  adjusted_plan   TEXT,
  reason          TEXT
);

-- Grant service_role access (not automatic when using SQL Editor vs Table Editor UI)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
