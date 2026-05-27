# Marathon Coach — Feature Development Plan
## Technical Reference for Claude Code Sessions

**Purpose:** Implementation guide for features to add after Phase A/B/C completion.  
**Architecture reference:** @docs/architecture.md  
**Principle:** No manual data entry. All data either syncs automatically or is captured through coaching conversations. If a data source requires manual input to function, it should degrade gracefully rather than show empty/broken UI.

---

## Current System State (as of Week 4)

### Working
- Strava OAuth2 + webhook → activities syncing to Supabase automatically
- MCP server on Railway with three read tools: `get_training_context`, `get_recent_activities`, `add_checkin`
- React dashboard on Vercel (hardcoded plan data, live activity feed)
- Claude reads training data automatically at start of coaching conversations

### Not Yet Built
- `plan_weeks` table not seeded — frontend plan is hardcoded
- `garmin_metrics` table empty — no sleep/HRV data flowing
- No write path from Claude back to the database (plan adjustments)
- No HR zone analysis, cadence progression, training load calculation
- No race time predictor

---

## Feature 1 — Garmin Connect Library Integration
**Priority: High | Effort: Medium | Phase: D**

### What It Does
Automatically syncs sleep scores, HRV, resting HR, and body battery from Garmin Connect into the `garmin_metrics` table. Runs on a schedule so data is always current without manual input.

### Implementation

**Install**
```bash
cd mcp-server
npm install garmin-connect node-cron
```

**Environment variables to add**
```bash
GARMIN_EMAIL=your@email.com
GARMIN_PASSWORD=yourpassword
GARMIN_SYNC_ENABLED=true
```

**Create `src/garmin/client.js`**
```javascript
import GarminConnect from 'garmin-connect'

let client = null
let lastLogin = null
const SESSION_DURATION_MS = 55 * 60 * 1000 // 55 minutes

export async function getGarminClient() {
  const now = Date.now()
  
  // Re-login if no session or session approaching expiry
  if (!client || !lastLogin || (now - lastLogin) > SESSION_DURATION_MS) {
    client = new GarminConnect({
      username: process.env.GARMIN_EMAIL,
      password: process.env.GARMIN_PASSWORD
    })
    await client.login()
    lastLogin = now
  }
  
  return client
}
```

**Create `src/garmin/sync.js`**
```javascript
import { getGarminClient } from './client.js'
import { supabase } from '../db/supabase.js'

export async function syncGarminDay(dateStr) {
  const client = await getGarminClient()
  
  // Use Promise.allSettled — if one metric fails, others still sync
  const [sleepResult, hrvResult, stressResult] = await Promise.allSettled([
    client.getSleepData(dateStr),
    client.getHrvData(dateStr),
    client.getStressData(dateStr)
  ])

  // Extract values safely — null if unavailable rather than crashing
  const sleep = sleepResult.status === 'fulfilled' ? sleepResult.value : null
  const hrv = hrvResult.status === 'fulfilled' ? hrvResult.value : null

  const metrics = {
    date: dateStr,
    sleep_score: sleep?.dailySleepDTO?.sleepScores?.overall?.value ?? null,
    sleep_duration_hrs: sleep?.dailySleepDTO?.sleepTimeSeconds
      ? parseFloat((sleep.dailySleepDTO.sleepTimeSeconds / 3600).toFixed(2))
      : null,
    resting_hr: sleep?.dailySleepDTO?.restingHeartRate ?? null,
    hrv_7day_avg: hrv?.hrvSummary?.weeklyAvg ?? null,
    hrv_status: hrv?.hrvSummary?.status ?? null,  // balanced / unbalanced / low
    body_battery_morning: null  // add if Garmin library exposes it
  }

  // Only upsert if at least one metric has real data
  const hasData = Object.values(metrics)
    .filter(v => v !== dateStr && v !== null)
    .length > 0

  if (!hasData) {
    console.log(`[Garmin] No data available for ${dateStr} — skipping`)
    return null
  }

  const { error } = await supabase
    .from('garmin_metrics')
    .upsert(metrics, { onConflict: 'date' })

  if (error) {
    console.error(`[Garmin] Supabase upsert failed for ${dateStr}:`, error.message)
    return null
  }

  return metrics
}

export async function syncGarminRecent(days = 7) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    try {
      const result = await syncGarminDay(dateStr)
      if (result) results.push(result)
    } catch (err) {
      // Log but don't throw — one failed day shouldn't stop the rest
      console.error(`[Garmin] Failed to sync ${dateStr}:`, err.message)
    }
  }

  console.log(`[Garmin] Synced ${results.length}/${days} days`)
  return results
}
```

**Add scheduled sync to `src/index.js`**
```javascript
import cron from 'node-cron'
import { syncGarminRecent } from './garmin/sync.js'

// Run at 08:00 every morning — after overnight sleep data is available
// Garmin Connect typically finalises sleep analysis by 07:00
if (process.env.GARMIN_SYNC_ENABLED === 'true') {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Garmin] Starting scheduled sync')
    try {
      await syncGarminRecent(2)  // last 2 days in case yesterday failed
    } catch (err) {
      // Garmin library breaks periodically — log, don't crash server
      console.error('[Garmin] Scheduled sync failed:', err.message)
    }
  })
  console.log('[Garmin] Scheduled sync enabled — runs at 08:00 daily')
}
```

**Add manual trigger endpoint (for testing and backfill)**
```javascript
app.post('/sync/garmin', async (req, res) => {
  const days = parseInt(req.query.days) || 7

  try {
    const results = await syncGarminRecent(days)
    res.json({ 
      success: true, 
      synced: results.length,
      dates: results.map(r => r.date)
    })
  } catch (err) {
    // Return degraded response, not 500 — library is known to be fragile
    res.json({ 
      success: false, 
      synced: 0,
      error: err.message,
      note: 'Garmin library may be temporarily broken — will retry tomorrow'
    })
  }
})
```

### Error Handling Strategy
The Garmin library breaks when Garmin changes internal endpoints. Handle this at every level:
- `Promise.allSettled` not `Promise.all` — partial data is better than no data
- Individual day failures are logged and skipped, not thrown
- Scheduled sync failures are caught and logged — server keeps running
- Manual endpoint returns a degraded response with explanation rather than a 500 error
- Dashboard components check for null and show "Awaiting sync" not broken UI

### Frontend Behaviour When Garmin Data Unavailable
```javascript
// In BiometricPanel.jsx — always degrade gracefully
{garminData ? (
  <SleepScore score={garminData.sleep_score} />
) : (
  <p className="text-gray-400 text-sm">Sleep data syncing...</p>
)}
```

---

## Feature 2 — Plan Weeks Database + Write Tools
**Priority: High | Effort: Medium | Phase: D**  
**Prerequisite for:** Plan adjustment write tools, race predictor, all plan-aware features

### What It Does
Seeds `plan_weeks` with the actual 52-week training plan, making the frontend dynamic and enabling Claude to write adjustments back to the database.

### Part A — Seed the plan_weeks table

Create `supabase/seed_plan_weeks.sql` and run in Supabase SQL editor:
```sql
-- Phase 1 Foundation weeks (1–16) — populate from training plan artifact
-- Pattern: progressive mileage with deload every 4th week
INSERT INTO plan_weeks 
  (week_number, phase_id, run1_target_km, run2_target_km, long_run_target_km, 
   total_target_km, gym_session, cycling_target_km, is_deload)
VALUES
  (1,  [phase1_id], 3, 4, 5,  12, 'Strength A', null, false),
  (2,  [phase1_id], 3, 5, 6,  14, 'Strength B', null, false),
  -- ... continue for all 52 weeks
  (4,  [phase1_id], 3, 4, 5,  12, 'Mobility',   null, true),  -- deload
```

**Get phase UUIDs first:**
```sql
SELECT id, phase_number, name FROM plan_phases ORDER BY phase_number;
```

### Part B — New MCP write tools

Add to `src/tools/plan.js`:
```javascript
// Tool: update_plan_week
// Claude calls this when coaching conversation identifies a needed adjustment
server.tool('update_plan_week', {
  week_number: { type: 'number' },
  total_target_km: { type: 'number', optional: true },
  run1_target_km: { type: 'number', optional: true },
  run2_target_km: { type: 'number', optional: true },
  long_run_target_km: { type: 'number', optional: true },
  notes: { type: 'string', optional: true }
}, async (params) => {
  const updates = Object.fromEntries(
    Object.entries(params)
      .filter(([k, v]) => k !== 'week_number' && v !== undefined)
  )
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('plan_weeks')
    .update(updates)
    .eq('week_number', params.week_number)

  if (error) throw new Error(`Plan update failed: ${error.message}`)
  return { success: true, week: params.week_number, changes: updates }
})

// Tool: log_plan_adjustment
// Permanent record of what changed and why
server.tool('log_plan_adjustment', {
  week_number: { type: 'number' },
  adjustment_type: { type: 'string' },  // mileage / intensity / rest / phase_extension
  original_plan: { type: 'string' },
  adjusted_plan: { type: 'string' },
  reason: { type: 'string' }
}, async (params) => {
  const { error } = await supabase
    .from('plan_adjustments')
    .insert({ ...params, date: new Date().toISOString() })

  if (error) throw new Error(`Adjustment log failed: ${error.message}`)
  return { success: true }
})
```

### Part C — Frontend reads from database
```javascript
// Replace hardcoded plan data in Phase1Table.jsx
// hooks/usePlanData.js
export function usePlanWeek(weekNumber) {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    supabase
      .from('plan_weeks')
      .select('*, plan_phases(name)')
      .eq('week_number', weekNumber)
      .single()
      .then(({ data }) => setData(data))
  }, [weekNumber])

  return data
}
```

---

## Feature 3 — HR Zone Analysis
**Priority: High | Effort: Low | Phase: D**

### What It Does
Calculates what percentage of each run was spent in each HR zone. Critical for Foundation phase — verifies runs are actually easy, not drifting into Zone 3.

### HR Zones (based on max HR 171 from Strava data)
```javascript
// src/utils/hrZones.js
export function getZones(maxHR = 171) {
  return {
    zone1: { min: 0,               max: Math.round(maxHR * 0.60), label: 'Recovery' },
    zone2: { min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), label: 'Easy/Aerobic' },
    zone3: { min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), label: 'Tempo' },
    zone4: { min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), label: 'Threshold' },
    zone5: { min: Math.round(maxHR * 0.90), max: maxHR,                    label: 'VO2max' }
  }
}

// Foundation phase target: >80% of run time in Zone 1-2
export function assessFoundationCompliance(avgHR, maxHR = 171) {
  const z2Max = Math.round(maxHR * 0.70)
  return {
    isEasy: avgHR <= z2Max,
    zone: avgHR <= Math.round(maxHR * 0.60) ? 1
        : avgHR <= Math.round(maxHR * 0.70) ? 2
        : avgHR <= Math.round(maxHR * 0.80) ? 3 : 4,
    warning: avgHR > z2Max 
      ? `Avg HR ${avgHR}bpm is Zone 3 — above easy threshold of ${z2Max}bpm`
      : null
  }
}
```

### Schema Addition
```sql
-- Add HR zone columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS hr_zone_primary INTEGER;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS hr_zone_warning BOOLEAN DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS effort_assessment TEXT;
-- 'easy' | 'moderate' | 'hard' | 'unknown'
```

### Calculate on webhook ingest
```javascript
// In webhook handler, after storing activity
const { zone, isEasy, warning } = assessFoundationCompliance(activity.avg_hr)
await supabase.from('activities').update({
  hr_zone_primary: zone,
  hr_zone_warning: !isEasy,
  effort_assessment: isEasy ? 'easy' : 'moderate'
}).eq('strava_id', activity.strava_id)
```

### MCP context addition
Include HR zone summary in `get_week_summary` tool response:
```javascript
hrZoneCompliance: {
  totalRuns: weekRuns.length,
  easyRuns: weekRuns.filter(r => r.effort_assessment === 'easy').length,
  warningRuns: weekRuns.filter(r => r.hr_zone_warning).length,
  foundationCompliant: weekRuns.every(r => r.effort_assessment === 'easy')
}
```

---

## Feature 4 — Cadence Progression Tracker
**Priority: High | Effort: Low | Phase: D**

### What It Does
Tracks cadence trend across all runs toward the 170spm gait goal. Separate from general trends — this is a specific rehabilitation/technique metric.

### Context
Current cadence from data: 155–156spm. Target: 170spm. Gait transition from heel to midfoot strike is a known concern. This chart makes the progression visible over the full training block.

### Frontend Component
```javascript
// components/activities/CadenceProgressionChart.jsx
// Uses recharts ReferenceLine to show target of 170spm
import { LineChart, Line, ReferenceLine, XAxis, YAxis, Tooltip } from 'recharts'

export function CadenceProgressionChart({ activities }) {
  const runData = activities
    .filter(a => a.activity_type === 'Run' && a.avg_cadence)
    .map(a => ({
      date: new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      cadence: a.avg_cadence,
      week: a.week_number
    }))
    .reverse()  // chronological

  return (
    <div>
      <h3>Cadence Progression (target: 170spm)</h3>
      <LineChart data={runData} width={600} height={250}>
        <XAxis dataKey="date" />
        <YAxis domain={[140, 180]} />
        <Tooltip />
        <ReferenceLine y={170} stroke="#22c55e" strokeDasharray="4 4" label="Target" />
        <Line type="monotone" dataKey="cadence" stroke="#3b82f6" dot={true} />
      </LineChart>
    </div>
  )
}
```

### MCP addition to `get_recent_activities` response
```javascript
cadenceTrend: {
  current: latestRun.avg_cadence,
  target: 170,
  gap: 170 - latestRun.avg_cadence,
  trend: calculateTrend(last8Runs.map(r => r.avg_cadence)),  // 'improving' | 'stable' | 'declining'
  weeksAtTarget: runs.filter(r => r.avg_cadence >= 170).length
}
```

---

## Feature 5 — Acute-Chronic Training Load Ratio
**Priority: High | Effort: Medium | Phase: D**

### What It Does
Injury risk indicator. Compares last 7 days of training load against the 28-day rolling average. A ratio above 1.5 significantly increases injury risk — important given posterior tibialis history.

### Calculation
```javascript
// src/utils/trainingLoad.js

// Training Stress Score approximation from HR and duration
// Uses simplified approach without lactate threshold HR (not yet established)
export function calculateRunLoad(durationSeconds, avgHR, maxHR = 171) {
  const hrRatio = avgHR / maxHR
  const durationMins = durationSeconds / 60
  // Simplified TSS — more accurate formula needs lactate threshold HR
  return Math.round((durationMins * hrRatio * hrRatio) / 60 * 100)
}

export async function getACRatio(supabase) {
  const { data: activities } = await supabase
    .from('activities')
    .select('date, duration_seconds, avg_hr, activity_type')
    .eq('activity_type', 'Run')
    .gte('date', new Date(Date.now() - 28 * 86400000).toISOString())
    .order('date', { ascending: false })

  const now = Date.now()
  const acuteLoad = activities
    .filter(a => now - new Date(a.date) <= 7 * 86400000)
    .reduce((sum, a) => sum + calculateRunLoad(a.duration_seconds, a.avg_hr), 0)

  const chronicLoad = activities
    .reduce((sum, a) => sum + calculateRunLoad(a.duration_seconds, a.avg_hr), 0) / 4

  const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : null

  return {
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    ratio: ratio ? parseFloat(ratio.toFixed(2)) : null,
    riskLevel: !ratio ? 'unknown'
      : ratio < 0.8  ? 'undertraining'
      : ratio <= 1.3 ? 'optimal'
      : ratio <= 1.5 ? 'caution'
      : 'high_risk',
    recommendation: ratio > 1.5
      ? 'Training load spike detected — consider an easy day given posterior tibialis history'
      : null
  }
}
```

### Include in `get_training_context` MCP tool
```javascript
trainingLoad: await getACRatio(supabase)
```

---

## Feature 6 — Race Time Predictor
**Priority: Medium | Effort: Medium | Phase: D**

### Accuracy Context
**Weeks 1–16 (now):** HR efficiency trend only — direction of travel, not a number. Insufficient stress data for meaningful prediction.  
**Week 16+ with parkrun/time trial:** Riegel formula gives ±3–5 minutes accuracy on marathon.  
**Ongoing:** VO2max estimation from sub-maximal HR/pace improves with more data.

### Implementation

```javascript
// src/utils/racePrediction.js

// Riegel formula — requires a recent race/time trial effort
// t2 = t1 × (d2/d1)^1.06
export function riegelPredict(knownDistanceKm, knownTimeSeconds, targetDistanceKm = 42.195) {
  return knownTimeSeconds * Math.pow(targetDistanceKm / knownDistanceKm, 1.06)
}

// VO2max estimation from sub-maximal run
// Requires: pace (m/s), HR, resting HR, max HR
// Based on Uth-Sørensen-Overgaard-Pedersen formula
export function estimateVO2max(runs, restingHR = 43, maxHR = 171) {
  // Filter for moderate effort runs (Zone 2-3) — best estimation zone
  const usableRuns = runs.filter(r => 
    r.avg_hr >= maxHR * 0.60 && 
    r.avg_hr <= maxHR * 0.75 &&
    r.distance_km >= 3
  )

  if (usableRuns.length === 0) return null

  // Average across usable runs for stability
  const vo2estimates = usableRuns.map(r => {
    const speedMS = (r.distance_km * 1000) / r.duration_seconds
    const hrReserve = (r.avg_hr - restingHR) / (maxHR - restingHR)
    return (speedMS * 3.5) / (hrReserve * 3.5)
  })

  return vo2estimates.reduce((a, b) => a + b) / vo2estimates.length
}

// Marathon time from VO2max (Daniels/Gilbert formula)
export function vo2maxToMarathonTime(vo2max) {
  // Velocity at VO2max in m/min
  const vVO2max = (vo2max - 0.8) / 0.1833
  // Marathon pace is approximately 75-80% of vVO2max for trained runners
  const marathonPace = vVO2max * 0.77
  const marathonTimeSeconds = (42195 / (marathonPace / 60))
  return marathonTimeSeconds
}

export function formatPrediction(timeSeconds) {
  const h = Math.floor(timeSeconds / 3600)
  const m = Math.floor((timeSeconds % 3600) / 60)
  const s = Math.round(timeSeconds % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export async function getCurrentPrediction(supabase) {
  const { data: runs } = await supabase
    .from('activities')
    .select('*')
    .eq('activity_type', 'Run')
    .not('avg_hr', 'is', null)
    .order('date', { ascending: false })
    .limit(20)

  if (!runs || runs.length < 4) {
    return {
      available: false,
      reason: 'Insufficient run data — prediction meaningful after 4+ weeks',
      trend: null
    }
  }

  const vo2max = estimateVO2max(runs)

  if (!vo2max) {
    return {
      available: false,
      reason: 'Runs to date insufficient for estimation — no Zone 2-3 efforts with full HR data',
      trend: null
    }
  }

  const predictedSeconds = vo2maxToMarathonTime(vo2max)

  // Week-by-week trend — split runs into 2-week buckets
  const recentRuns = runs.slice(0, 8)
  const olderRuns = runs.slice(8, 16)
  const recentVO2 = estimateVO2max(recentRuns)
  const olderVO2 = estimateVO2max(olderRuns)
  const trend = recentVO2 && olderVO2
    ? recentVO2 > olderVO2 ? 'improving' : 'stable'
    : null

  return {
    available: true,
    estimatedVO2max: parseFloat(vo2max.toFixed(1)),
    predictedFinish: formatPrediction(predictedSeconds),
    predictedSeconds,
    confidence: runs.length >= 12 ? 'moderate' : 'low',
    confidenceNote: runs.length < 12
      ? 'Low confidence — based on easy running only. Will improve with tempo/race efforts.'
      : 'Moderate confidence — increases after first parkrun or time trial',
    trend,
    vsGoals: {
      northStar: predictedSeconds <= 10800 ? 'on track' : `${Math.round((predictedSeconds - 10800) / 60)}min off`,
      aGoal: predictedSeconds <= 12600 ? 'on track' : `${Math.round((predictedSeconds - 12600) / 60)}min off`
    }
  }
}
```

### Add to MCP `get_training_context`
```javascript
racePrediction: await getCurrentPrediction(supabase)
```

### Add parkrun / time trial recording
```javascript
// When a Strava activity is tagged as a race or specific effort
// Flag it for use as a Riegel prediction anchor
// Check activity.workout_type from Strava:
// 1 = race, 2 = long run, 3 = workout
if (activity.workout_type === 1) {
  // Use Riegel formula for prediction instead of VO2max estimation
  const riegelTime = riegelPredict(activity.distance_km, activity.duration_seconds)
  // Store as a reference effort
}
```

---

## Feature 7 — Long Run Progression Tracker
**Priority: Medium | Effort: Low | Phase: D**

### What It Does
Isolates the longest run of each week as a separate trend line. The long run is the most important session in marathon training — it should be visible independently of total mileage.

### Implementation
```javascript
// In weekly aggregation query — identify longest run per week
const { data } = await supabase
  .from('activities')
  .select('week_number, distance_km, date')
  .eq('activity_type', 'Run')
  .order('week_number', { ascending: true })

// Group by week and find max
const longRunByWeek = Object.values(
  data.reduce((acc, run) => {
    const w = run.week_number
    if (!acc[w] || run.distance_km > acc[w].distance_km) {
      acc[w] = run
    }
    return acc
  }, {})
)
```

### Frontend Component
```javascript
// LongRunProgressionChart.jsx
// Two lines: actual long run + plan target long run
// ReferenceLine at 32km — standard marathon long run peak
<LineChart data={longRunByWeek}>
  <ReferenceLine y={32} label="Peak long run" stroke="#ef4444" strokeDasharray="4 4" />
  <Line dataKey="actual" name="Actual long run" stroke="#3b82f6" />
  <Line dataKey="target" name="Plan target" stroke="#9ca3af" strokeDasharray="4 4" />
</LineChart>
```

---

## Feature 8 — Cross-Training Integration
**Priority: Low | Effort: Low | Phase: D**

### What It Does
Weight training, cycling, Pilates, and stair stepper are already syncing from Strava but aren't assessed against targets or included in training load. This surfaces them in weekly context.

### Schema Addition
```sql
ALTER TABLE plan_weeks ADD COLUMN IF NOT EXISTS cross_train_sessions_target INTEGER DEFAULT 2;
ALTER TABLE plan_weeks ADD COLUMN IF NOT EXISTS notes_strength TEXT;
```

### MCP addition to `get_week_summary`
```javascript
crossTraining: {
  sessions: weekActivities.filter(a => 
    ['WeightTraining', 'Ride', 'Pilates', 'StairStepper', 'Yoga'].includes(a.activity_type)
  ).map(a => ({
    type: a.activity_type,
    date: a.date,
    duration_min: Math.round(a.duration_seconds / 60)
  })),
  gymSessionsCompleted: weekActivities.filter(a => a.activity_type === 'WeightTraining').length,
  targetGymSessions: currentWeek.cross_train_sessions_target
}
```

---

## Feature 9 — Pre-Session Brief Tool
**Priority: Medium | Effort: Low | Phase: D**

### What It Does
New MCP tool Claude can call to generate a specific brief for the next planned session based on where you are in the training plan, current fatigue indicators, and known health concerns.

### New MCP Tool
```javascript
server.tool('get_next_session_brief', {}, async () => {
  const context = await getTrainingContext()
  const load = await getACRatio(supabase)
  
  return {
    sessionType: determineNextSession(context),
    paceGuidance: {
      target: '7:00–7:30/km',
      rationale: 'Zone 2 — Foundation phase, aerobic base building',
      hrCeiling: Math.round(171 * 0.70)  // 70% max HR
    },
    cadenceFocus: context.cadenceTrend?.current < 165
      ? 'Focus on quick light steps — aim for 165+ spm this session'
      : null,
    calfNote: 'Monitor left posterior tibialis — stop if any tightness develops',
    loadWarning: load.riskLevel === 'caution' || load.riskLevel === 'high_risk'
      ? load.recommendation
      : null,
    duration: 'Keep to planned distance — do not extend even if feeling good'
  }
})
```

---

## Build Order Recommendation

Sequence that minimises rework and maximises value at each step:

```
1. Seed plan_weeks table (SQL only — 1 hour)
   └── Unlocks: dynamic frontend, plan adjustment tools, all plan-aware features

2. HR zone calculation on webhook ingest (backend only — 2 hours)
   └── Immediately enriches all future activities
   └── Backfill existing activities in same session

3. Garmin Connect library with full error handling (3–4 hours)
   └── Completes the data layer — sleep/HRV starts flowing automatically

4. Plan adjustment MCP write tools (2 hours)
   └── Requires plan_weeks seeded first

5. AC Ratio training load (backend + MCP — 2 hours)
   └── Injury risk visibility before mileage ramps up in Phase 2

6. Race predictor (backend + MCP — 2 hours)
   └── Low confidence now but data accumulates — better to start tracking early

7. Frontend chart additions (3–4 hours)
   └── Cadence progression, long run tracker, HR zone display

8. Pre-session brief tool (1 hour)
   └── Highest coaching value-to-effort ratio
```

---

## Claude Code Session Prompt Template

Use this at the start of any feature build session:

```
Read @docs/architecture.md and @docs/feature-development-plan.md

Building [FEATURE NAME] today. Reference the implementation detail 
in the feature development plan document.

Current system state:
- Strava → Supabase webhook sync: working
- MCP server on Railway: working  
- React dashboard on Vercel: working
- plan_weeks: [seeded / not yet seeded]
- garmin_metrics: [flowing / empty]

Single-user personal app — no RLS, no multi-tenancy.
Build the feature, add appropriate error handling, then stop and show me 
what was created before moving to anything else.
```

---

## Key Constants Reference

```javascript
const PLAN_START_DATE = '2026-05-05'
const MAX_HR = 171           // from Strava data
const RESTING_HR = 43        // from Garmin data
const CADENCE_TARGET = 170   // spm — gait transition goal
const RACE_DATE = '2027-05-05'  // Belfast Marathon

// HR Zones
const ZONES = {
  z1_max: Math.round(171 * 0.60),  // 103
  z2_max: Math.round(171 * 0.70),  // 120  ← Foundation phase ceiling
  z3_max: Math.round(171 * 0.80),  // 137
  z4_max: Math.round(171 * 0.90),  // 154
}
```
