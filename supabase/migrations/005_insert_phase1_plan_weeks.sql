INSERT INTO plan_phases (phase_number, name, start_date, end_date, goal, active)
VALUES (1, 'Foundation', '2026-05-05', '2026-08-24', 'Build aerobic base — easy running only, establish consistency', true);

INSERT INTO plan_weeks (week_number, phase_id, run1_target_km, run2_target_km, long_run_target_km, total_target_km, gym_session, cycling_target_km, is_deload)
SELECT
  w.week_number, p.id,
  w.run1, w.run2, w.long_run, w.total, w.gym, w.cycling, w.deload
FROM plan_phases p,
(VALUES
  (1,  3::decimal, 4, 5,  12, 'Strength A', 22.5, false),
  (2,  3,          4, 6,  13, 'Strength A', 22.5, false),
  (3,  4,          5, 7,  16, 'Strength A', 27.5, false),
  (4,  3,          4, 5,  12, 'Mobility',   20,   true),
  (5,  4,          5, 8,  17, 'Strength A', 30,   false),
  (6,  4,          6, 9,  19, 'Strength A', 32.5, false),
  (7,  5,          6, 10, 21, 'Strength A', 35,   false),
  (8,  4,          5, 7,  16, 'Mobility',   25,   true),
  (9,  5,          7, 12, 24, 'Strength B', 40,   false),
  (10, 5,          7, 13, 25, 'Strength B', 40,   false),
  (11, 6,          8, 14, 28, 'Strength B', 45,   false),
  (12, 5,          6, 10, 21, 'Mobility',   30,   true),
  (13, 6,          8, 15, 29, 'Strength B', 47.5, false),
  (14, 6,          8, 16, 30, 'Strength B', 50,   false),
  (15, 7,          9, 17, 33, 'Strength B', 52.5, false),
  (16, 6,          7, 12, 25, 'Mobility',   35,   true)
) AS w(week_number, run1, run2, long_run, total, gym, cycling, deload)
WHERE p.phase_number = 1;
