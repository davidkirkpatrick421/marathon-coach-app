-- PLAN_START changed from 2026-05-11 to 2026-05-05 (week 1 = May 5-11 pre-plan,
-- week 2 = first run week May 12-18, giving week 4 = May 26 deload week).
UPDATE activities
SET week_number = FLOOR(
  EXTRACT(EPOCH FROM (date - TIMESTAMPTZ '2026-05-05 00:00:00+00')) / 604800
) + 1;
