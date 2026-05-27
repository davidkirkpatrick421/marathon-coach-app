-- auth_tokens holds live Strava OAuth tokens; anon key is public in the frontend
-- bundle, so anon must never be able to read this table.
REVOKE SELECT ON auth_tokens FROM anon;
