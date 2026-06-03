-- service_role was missing INSERT/SELECT/UPDATE on garmin_sync_status.
-- The migration 007 comment incorrectly assumed service_role bypasses table grants;
-- it bypasses RLS but still needs explicit privileges like any other role.
GRANT SELECT, INSERT, UPDATE ON garmin_sync_status TO service_role;
