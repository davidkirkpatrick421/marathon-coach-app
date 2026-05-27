export const PLAN_START = new Date('2026-05-11')

export function getCurrentWeek() {
  const diff = Math.floor((new Date() - PLAN_START) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(Math.max(diff + 1, 1), 16)
}

export function getWeekDates(weekNum) {
  const start = new Date(PLAN_START)
  start.setDate(start.getDate() + (weekNum - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(start)} – ${fmt(end)}`
}

export const goals = [
  { label: 'North Star', time: 'Sub 3:00', pace: '4:15/km', emoji: '⭐', color: '#f59e0b', note: 'Everything clicks, mileage exceeds expectations' },
  { label: 'A Goal', time: '3:15–3:30', pace: '4:37–4:58/km', emoji: '🎯', color: '#f97316', note: 'Solid year, consistent training, no major injury' },
  { label: 'B Goal', time: '3:45–4:00', pace: '5:19–5:41/km', emoji: '✅', color: '#22c55e', note: 'Realistic given 3 days/week — still a massive PB' },
]

export const baseline = [
  { label: 'Previous Marathon', value: '5:09', sub: 'Belfast — injury hampered' },
  { label: 'Garmin 5K Prediction', value: '26:56', sub: '5:23/km' },
  { label: 'Garmin Marathon Prediction', value: '4:53:20', sub: 'Baseline — May 2026' },
  { label: 'Current Easy Pace', value: '~7:29/km', sub: 'Zone 2 effort' },
  { label: 'Weekly Run Days', value: '3 days', sub: '+ gym 1–2x + cycling' },
  { label: 'Race Target', value: 'May 2027', sub: 'Belfast Marathon' },
]

export const phases = [
  { id: 1, name: 'Foundation', weeks: '1–16', dates: 'May–Aug 2026', color: '#22c55e', goal: 'Build structural readiness. All running easy. Tendons, glutes, aerobic engine.', active: true },
  { id: 2, name: 'Aerobic Development', weeks: '17–32', dates: 'Sep–Dec 2026', color: '#3b82f6', goal: 'Train like a runner. Introduce tempo. Long run to 20km. Half marathon benchmark.', active: false },
  { id: 3, name: 'Marathon Build', weeks: '33–48', dates: 'Jan–Apr 2027', color: '#f97316', goal: 'Race-specific work. Long run peaks at 30–32km. Tune-up half marathon in Feb/Mar.', active: false },
  { id: 4, name: 'Taper', weeks: '49–51', dates: 'Apr–May 2027', color: '#a855f7', goal: 'Cut volume 40%/week, keep intensity. Trust the training.', active: false },
]

export const phase1Weeks = [
  { week: 1,  run1: '3km easy', run2: '4km easy', longRun: '5km easy',  total: '12km', gym: 'Strength A', cycling: '20–25km', deload: false },
  { week: 2,  run1: '3km easy', run2: '4km easy', longRun: '6km easy',  total: '13km', gym: 'Strength A', cycling: '20–25km', deload: false },
  { week: 3,  run1: '4km easy', run2: '5km easy', longRun: '7km easy',  total: '16km', gym: 'Strength A', cycling: '25–30km', deload: false },
  { week: 4,  run1: '3km easy', run2: '4km easy', longRun: '5km easy',  total: '12km', gym: 'Mobility',   cycling: '20km',    deload: true  },
  { week: 5,  run1: '4km easy', run2: '5km easy', longRun: '8km easy',  total: '17km', gym: 'Strength A', cycling: '30km',    deload: false },
  { week: 6,  run1: '4km easy', run2: '6km easy', longRun: '9km easy',  total: '19km', gym: 'Strength A', cycling: '30–35km', deload: false },
  { week: 7,  run1: '5km easy', run2: '6km easy', longRun: '10km easy', total: '21km', gym: 'Strength A', cycling: '35km',    deload: false },
  { week: 8,  run1: '4km easy', run2: '5km easy', longRun: '7km easy',  total: '16km', gym: 'Mobility',   cycling: '25km',    deload: true  },
  { week: 9,  run1: '5km easy', run2: '7km easy', longRun: '12km easy', total: '24km', gym: 'Strength B', cycling: '40km',    deload: false },
  { week: 10, run1: '5km easy', run2: '7km easy', longRun: '13km easy', total: '25km', gym: 'Strength B', cycling: '40km',    deload: false },
  { week: 11, run1: '6km easy', run2: '8km easy', longRun: '14km easy', total: '28km', gym: 'Strength B', cycling: '45km',    deload: false },
  { week: 12, run1: '5km easy', run2: '6km easy', longRun: '10km easy', total: '21km', gym: 'Mobility',   cycling: '30km',    deload: true  },
  { week: 13, run1: '6km easy', run2: '8km easy', longRun: '15km easy', total: '29km', gym: 'Strength B', cycling: '45–50km', deload: false },
  { week: 14, run1: '6km easy', run2: '8km easy', longRun: '16km easy', total: '30km', gym: 'Strength B', cycling: '50km',    deload: false },
  { week: 15, run1: '7km easy', run2: '9km easy', longRun: '17km easy', total: '33km', gym: 'Strength B', cycling: '50–55km', deload: false },
  { week: 16, run1: '6km easy', run2: '7km easy', longRun: '12km easy', total: '25km', gym: 'Mobility',   cycling: '35km',    deload: true  },
]

export const strengthA = [
  { exercise: 'Glute Bridges',              sets: '3×15',         note: 'Squeeze at top, hold 1 sec' },
  { exercise: 'Calf Raises — Eccentric',    sets: '3×15 each',    note: 'Slow 3-sec lower. Do single leg' },
  { exercise: 'Single-Leg Squat (to box)',  sets: '3×8 each',     note: 'Control the descent' },
  { exercise: 'Side-Lying Hip Abduction',   sets: '3×15',         note: 'Slow and controlled' },
  { exercise: 'Dead Bug',                   sets: '3×10',         note: 'Lower back pressed to floor throughout' },
  { exercise: 'Hip Flexor Stretch Hold',    sets: '2 min each',   note: 'Kneeling lunge position' },
]

export const strengthB = [
  { exercise: 'Bulgarian Split Squat',              sets: '3×10 each',          note: 'Dumbbells, rear foot elevated' },
  { exercise: 'Romanian Deadlift',                  sets: '3×10',               note: 'Hinge at hips, soft knee' },
  { exercise: 'Single-Leg Calf Raise (weighted)',   sets: '3×12',               note: 'Hold dumbbell, full range' },
  { exercise: 'Lateral Band Walks',                 sets: '3×15 each direction', note: 'Resistance band above knees' },
  { exercise: 'Copenhagen Plank',                   sets: '3×20 sec each',      note: 'Side plank, top foot on bench' },
  { exercise: 'Dead Bug',                           sets: '3×10',               note: 'Maintain lower back contact' },
]

export const nutritionPrinciples = [
  { title: 'Small deficit now',        body: '200–300 cal/day deficit in Phase 1 only. Not aggressive — one less snack or smaller portion. Drop the deficit entirely once Phase 3 starts.' },
  { title: 'Protein is the lever',     body: '1.4–1.8g per kg of bodyweight daily. Keeps you full, supports recovery, preserves muscle. Eat protein throughout the day, not just at dinner.' },
  { title: 'Post-run protein window',  body: 'Within 30 minutes of finishing any run or gym session. Greek yoghurt, eggs, protein shake — whatever works. Non-negotiable habit to build now.' },
  { title: 'Carbs around training',    body: 'More carbs on run days and gym days, less on rest days. Don\'t slash carbs entirely — you need them. Just earn them on training days.' },
  { title: 'Healthy fats — don\'t skip', body: 'Olive oil, eggs, avocado, oily fish (salmon, mackerel). Fat intake stays relatively constant throughout the training year.' },
  { title: 'Chef life — pre-shift meal', body: 'Eat a proper meal before shifts. Late-night post-shift eating is where most belly fat accumulates. Front-load fuel, don\'t back-load it.' },
]

export const keyPrinciples = [
  { icon: '🟢', title: '80% Easy',               body: 'Most runs should be genuinely conversational. If you\'re breathing hard, slow down. Easy now = fast later.' },
  { icon: '🚴', title: 'Cycling = Training',      body: 'Not a compromise. Non-impact aerobic work is a gift for someone with a knee history. A 2hr ride contributes meaningfully to your engine.' },
  { icon: '🏋️', title: 'Never Skip Strength',    body: 'Most runners drop it when mileage climbs. That\'s exactly when you need it most. It\'s your injury insurance.' },
  { icon: '📅', title: 'Deload Weeks Are Sacred', body: 'Every 4th week is lighter. This is when adaptation happens. Don\'t skip them because you feel good.' },
  { icon: '📋', title: 'Stick to the Plan',       body: 'Don\'t add distance or effort mid-session. The plan is cumulative. Individual heroics wreck the pattern.' },
  { icon: '🩺', title: 'Get a Physio',            body: 'Book now while volume is low. Fix the knee pattern before mileage climbs. Highest ROI thing you can do.' },
]
