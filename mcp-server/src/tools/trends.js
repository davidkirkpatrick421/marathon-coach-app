import { z } from 'zod'
import supabase from '../db/supabase.js'

const PLAN_START = new Date('2026-05-05')
const CADENCE_TARGET = 170
const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun']

function currentWeekNumber() {
  const diff = Date.now() - PLAN_START.getTime()
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1)
}

function weekStartDate(weekNum) {
  const ms = PLAN_START.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000
  return new Date(ms).toISOString().split('T')[0]
}

// Linear regression slope → 'improving' / 'stable' / 'declining'
// Pass values where higher = better. Negate before calling if lower = better.
function detectTrend(values) {
  if (values.length < 3) return 'insufficient_data'
  const n = values.length
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean)
    den += (i - xMean) ** 2
  }
  if (den === 0) return 'stable'
  const slope = num / den
  const threshold = Math.abs(yMean) * 0.005
  if (slope > threshold) return 'improving'
  if (slope < -threshold) return 'declining'
  return 'stable'
}

// EF = meters_per_minute / avg_hr — higher is better
function calcEF(distanceKm, durationSeconds, avgHr) {
  if (!distanceKm || !durationSeconds || !avgHr || avgHr === 0) return null
  const mpm = (distanceKm * 1000) / (durationSeconds / 60)
  return Math.round((mpm / avgHr) * 1000) / 1000
}

// Aerobic decoupling from Strava splits_metric
// < 5% = well-trained aerobic base. Positive = HR drifted up relative to pace (normal).
function calcDecoupling(splits) {
  if (!splits || splits.length < 4) return null
  const half = Math.floor(splits.length / 2)

  function halfEF(set) {
    const speeds = set.map(s => s.average_speed).filter(Boolean)
    const hrs = set.map(s => s.average_heartrate).filter(Boolean)
    if (!speeds.length || !hrs.length) return null
    const avgMPM = (speeds.reduce((a, b) => a + b, 0) / speeds.length) * 60
    const avgHR = hrs.reduce((a, b) => a + b, 0) / hrs.length
    return avgHR > 0 ? avgMPM / avgHR : null
  }

  const ef1 = halfEF(splits.slice(0, half))
  const ef2 = halfEF(splits.slice(half))
  if (!ef1 || !ef2 || ef1 === 0) return null
  return Math.round(((ef1 - ef2) / ef1) * 1000) / 10 // percentage, 1 d.p.
}

// HR drift analysis from splits
function calcHRDrift(splits, distanceKm) {
  if (!splits || splits.length < 2) return null
  const hrs = splits.map(s => s.average_heartrate).filter(Boolean)
  if (hrs.length < 2) return null
  const absoluteDrift = hrs[hrs.length - 1] - hrs[0]
  const driftPerKm = distanceKm > 0 ? Math.round((absoluteDrift / distanceKm) * 10) / 10 : null
  const category = driftPerKm === null ? null
    : driftPerKm < 5 ? 'low'
    : driftPerKm < 10 ? 'moderate'
    : 'high'
  return {
    km1HR: Math.round(hrs[0]),
    finalKmHR: Math.round(hrs[hrs.length - 1]),
    absoluteDrift: Math.round(absoluteDrift),
    driftPerKm,
    category,
  }
}

// Simplified TSS using HR zones (Foundation phase multipliers)
function calcTSS(activity) {
  const durationMin = activity.duration_seconds ? activity.duration_seconds / 60 : null
  if (!durationMin || durationMin <= 0) return 0

  if (RUN_TYPES.includes(activity.activity_type)) {
    const hr = activity.avg_hr
    if (!hr) return durationMin * 1.0 // assume Zone 2 if no HR
    if (hr < 114) return durationMin * 0.5  // Zone 1
    if (hr < 149) return durationMin * 1.0  // Zone 2
    if (hr < 167) return durationMin * 1.5  // Zone 3
    return durationMin * 2.0                 // Zone 4+
  }

  const type = activity.activity_type
  if (['WeightTraining', 'Workout'].includes(type)) return 35
  if (['Yoga'].includes(type)) return 20
  if (['Hike', 'Walk'].includes(type)) return durationMin * 0.4
  if (['Ride', 'VirtualRide', 'EBikeRide'].includes(type)) return durationMin * 0.6
  return 30 // unknown cross-training
}

function avg(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
}

export function registerTrendsTool(server) {
  server.tool(
    'get_trends',
    'Pre-computed training trends across recent activities: aerobic efficiency factor, aerobic decoupling, cadence consistency, HR drift per km, training load (ATL/CTL/stress balance), sleep–run HR correlation, and injury risk indicators. Call when the athlete asks about progress, fitness trends, or overtraining risk.',
    {
      weeks: z.number().int().min(4).max(16).optional()
        .describe('Number of weeks to analyse (default 8, max 16)'),
    },
    async ({ weeks = 8 }) => {
      const weekNum = currentWeekNumber()
      const startWeek = Math.max(1, weekNum - weeks)
      const startDate = weekStartDate(startWeek)

      const [
        { data: allActivities },
        { data: planWeeks },
        { data: garminMetrics },
      ] = await Promise.all([
        supabase
          .from('activities')
          .select('strava_id, date, activity_type, distance_km, duration_seconds, avg_hr, avg_cadence, week_number, splits')
          .gte('week_number', startWeek)
          .lte('week_number', weekNum)
          .order('date', { ascending: true }),
        supabase
          .from('plan_weeks')
          .select('week_number, total_target_km')
          .gte('week_number', startWeek)
          .lte('week_number', weekNum),
        supabase
          .from('garmin_metrics')
          .select('date, sleep_score')
          .gte('date', startDate)
          .order('date', { ascending: true }),
      ])

      const activities = allActivities ?? []
      const planMap = Object.fromEntries(
        (planWeeks ?? []).map(w => [w.week_number, parseFloat(w.total_target_km ?? 0)])
      )
      const garminMap = Object.fromEntries((garminMetrics ?? []).map(g => [g.date, g]))

      // Easy runs only: Run types, >20 min, avg_hr present and < 158
      const easyRuns = activities.filter(a =>
        RUN_TYPES.includes(a.activity_type) &&
        a.duration_seconds > 20 * 60 &&
        a.avg_hr != null &&
        a.avg_hr < 158
      )

      const allRuns = activities.filter(a => RUN_TYPES.includes(a.activity_type))

      // ── AEROBIC EFFICIENCY ────────────────────────────────────────────────
      const efPerRun = easyRuns.map(a => {
        const splits = a.splits ?? null
        return {
          date: a.date?.split('T')[0],
          week: a.week_number,
          ef: calcEF(parseFloat(a.distance_km ?? 0), a.duration_seconds, a.avg_hr),
          decoupling: splits ? calcDecoupling(splits) : null,
          hasSplits: !!splits,
        }
      })

      const decouplingValues = efPerRun.map(r => r.decoupling).filter(v => v !== null)

      const efByWeek = {}
      for (const r of efPerRun) {
        if (r.ef != null) {
          if (!efByWeek[r.week]) efByWeek[r.week] = []
          efByWeek[r.week].push(r.ef)
        }
      }
      const weeklyAvgEF = Object.entries(efByWeek)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, vals]) => ({
          week: Number(week),
          ef: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 1000) / 1000,
        }))

      const runsWithoutSplits = efPerRun.filter(r => !r.hasSplits).length

      // ── CADENCE ───────────────────────────────────────────────────────────
      const cadenceRuns = easyRuns.filter(a => a.avg_cadence != null)
      const cadencePerRun = cadenceRuns.map(a => ({
        date: a.date?.split('T')[0],
        week: a.week_number,
        cadence: a.avg_cadence,
      }))

      const cadenceByWeek = {}
      for (const r of cadencePerRun) {
        if (!cadenceByWeek[r.week]) cadenceByWeek[r.week] = []
        cadenceByWeek[r.week].push(r.cadence)
      }
      const weeklyAvgCadence = Object.entries(cadenceByWeek)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, vals]) => ({
          week: Number(week),
          cadence: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        }))

      const recentCadenceAvg = cadencePerRun.length > 0
        ? Math.round(avg(cadencePerRun.slice(-3).map(r => r.cadence)))
        : null

      const periodCadenceAvg = cadencePerRun.length > 0
        ? avg(cadencePerRun.map(r => r.cadence))
        : null

      const consistencyScore = recentCadenceAvg && cadencePerRun.length >= 3
        ? Math.round(
            cadencePerRun.filter(r => Math.abs(r.cadence - recentCadenceAvg) <= 5).length
            / cadencePerRun.length * 100
          )
        : null

      // ── HR DRIFT ──────────────────────────────────────────────────────────
      const hrDriftPerRun = easyRuns
        .filter(a => a.splits)
        .map(a => {
          const drift = calcHRDrift(a.splits, parseFloat(a.distance_km ?? 0))
          if (!drift) return null
          return { date: a.date?.split('T')[0], week: a.week_number, ...drift }
        })
        .filter(Boolean)

      const driftByWeek = {}
      for (const r of hrDriftPerRun) {
        if (r.driftPerKm !== null) {
          if (!driftByWeek[r.week]) driftByWeek[r.week] = []
          driftByWeek[r.week].push(r.driftPerKm)
        }
      }
      const weeklyAvgDriftPerKm = Object.entries(driftByWeek)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, vals]) => ({
          week: Number(week),
          driftPerKm: Math.round(avg(vals) * 10) / 10,
        }))

      // ── TRAINING LOAD (ATL / CTL) ─────────────────────────────────────────
      const dailyTSS = {}
      for (const a of activities) {
        const date = a.date?.split('T')[0]
        if (!date) continue
        const tss = calcTSS({ ...a, distance_km: parseFloat(a.distance_km ?? 0) })
        dailyTSS[date] = (dailyTSS[date] ?? 0) + tss
      }

      const today = new Date().toISOString().split('T')[0]
      const dateRange = []
      const cursor = new Date(startDate + 'T00:00:00Z')
      const endDay = new Date(today + 'T00:00:00Z')
      while (cursor <= endDay) {
        dateRange.push(cursor.toISOString().split('T')[0])
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }

      let atl = 0, ctl = 0
      const atlAlpha = 1 / 7
      const ctlAlpha = 1 / 42
      const weeklyTSS = {}

      for (const date of dateRange) {
        const tss = dailyTSS[date] ?? 0
        atl = atl * (1 - atlAlpha) + tss * atlAlpha
        ctl = ctl * (1 - ctlAlpha) + tss * ctlAlpha
        const wn = Math.floor((new Date(date + 'T00:00:00Z') - PLAN_START) / (7 * 24 * 60 * 60 * 1000)) + 1
        weeklyTSS[wn] = (weeklyTSS[wn] ?? 0) + tss
      }

      const stressBalance = ctl > 0 ? Math.round((atl / ctl) * 100) / 100 : null
      const trainingLoadStatus = stressBalance === null ? 'insufficient_data'
        : stressBalance < 0.8 ? 'undertraining'
        : stressBalance <= 1.3 ? 'optimal'
        : stressBalance <= 1.5 ? 'high'
        : 'overreaching_risk'

      const weeklyTSSArray = Object.entries(weeklyTSS)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, tss]) => ({ week: Number(week), tss: Math.round(tss) }))

      // ── SLEEP–TRAINING CORRELATION ────────────────────────────────────────
      const sleepRunPairs = easyRuns.flatMap(a => {
        const runDate = a.date?.split('T')[0]
        if (!runDate) return []
        const prevDate = new Date(new Date(runDate + 'T00:00:00Z').getTime() - 86400000)
          .toISOString().split('T')[0]
        const g = garminMap[prevDate]
        if (!g?.sleep_score) return []
        return [{ sleep_score: g.sleep_score, avg_hr: a.avg_hr }]
      })

      const wellRested = sleepRunPairs.filter(p => p.sleep_score >= 80)
      const poorlyRested = sleepRunPairs.filter(p => p.sleep_score < 70)

      const sleepTrainingCorrelation = {
        pairsAnalysed: sleepRunPairs.length,
        avgSleepScoreBeforeRun: sleepRunPairs.length > 0
          ? Math.round(avg(sleepRunPairs.map(p => p.sleep_score)))
          : null,
        avgHRWhenWellRested: wellRested.length >= 2
          ? Math.round(avg(wellRested.map(p => p.avg_hr)))
          : null,
        avgHRWhenPoorlyRested: poorlyRested.length >= 2
          ? Math.round(avg(poorlyRested.map(p => p.avg_hr)))
          : null,
        dataInsufficient: sleepRunPairs.length < 4,
      }

      // ── INJURY RISK ───────────────────────────────────────────────────────
      const runDateSet = new Set(allRuns.map(a => a.date?.split('T')[0]).filter(Boolean))
      let maxConsecutive = 0, currentConsecutive = 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
        if (runDateSet.has(d)) {
          currentConsecutive++
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
        } else {
          currentConsecutive = 0
        }
      }

      const thisWeekKm = allRuns
        .filter(a => a.week_number === weekNum)
        .reduce((s, a) => s + parseFloat(a.distance_km ?? 0), 0)
      const lastWeekKm = allRuns
        .filter(a => a.week_number === weekNum - 1)
        .reduce((s, a) => s + parseFloat(a.distance_km ?? 0), 0)
      const mileageChangePct = lastWeekKm > 0
        ? Math.round(((thisWeekKm - lastWeekKm) / lastWeekKm) * 100)
        : null

      const cadenceDropFromBaseline = recentCadenceAvg != null && periodCadenceAvg != null
        ? Math.round(periodCadenceAvg - recentCadenceAvg)
        : null

      const periodAvgHR = easyRuns.length > 0 ? avg(easyRuns.map(a => a.avg_hr)) : null
      const recentAvgHR = easyRuns.length >= 2
        ? avg(easyRuns.slice(-3).map(a => a.avg_hr))
        : null
      const hrElevationFromBaseline = recentAvgHR != null && periodAvgHR != null
        ? Math.round(recentAvgHR - periodAvgHR)
        : null

      const riskFactors = []
      if (maxConsecutive >= 3) riskFactors.push(`${maxConsecutive} consecutive run days in last 7 days`)
      if (mileageChangePct != null && mileageChangePct > 10) riskFactors.push(`Weekly run mileage up ${mileageChangePct}% (>10% threshold)`)
      if (cadenceDropFromBaseline != null && cadenceDropFromBaseline > 5) riskFactors.push(`Cadence dropped ${cadenceDropFromBaseline} spm below period baseline`)
      if (hrElevationFromBaseline != null && hrElevationFromBaseline > 8) riskFactors.push(`Easy-run HR elevated ${hrElevationFromBaseline} bpm above baseline`)

      const riskLevel = riskFactors.length === 0 ? 'low'
        : riskFactors.length === 1 ? 'moderate'
        : 'high'

      // ── COMPLIANCE ────────────────────────────────────────────────────────
      const weeklyCompliance = []
      for (let w = startWeek; w < weekNum; w++) {
        const target = planMap[w] ?? null
        if (!target || target <= 0) continue
        const actual = allRuns
          .filter(a => a.week_number === w)
          .reduce((s, a) => s + parseFloat(a.distance_km ?? 0), 0)
        weeklyCompliance.push({
          week: w,
          targetKm: parseFloat(target),
          actualKm: Math.round(actual * 10) / 10,
          pct: Math.round((actual / target) * 100),
        })
      }
      const avgCompliance = weeklyCompliance.length > 0
        ? Math.round(avg(weeklyCompliance.map(w => w.pct)))
        : null

      // ── ASSEMBLE RESULT ───────────────────────────────────────────────────
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            analysedWeeks: weeks,
            currentWeek: weekNum,
            easyRunsAnalysed: easyRuns.length,
            dataNote: easyRuns.length < 4
              ? 'Limited data — most trend metrics become meaningful with 4+ easy runs'
              : null,

            aerobicEfficiency: {
              perRun: efPerRun.map(r => ({ date: r.date, week: r.week, ef: r.ef, decoupling: r.decoupling })),
              weeklyAvgEF,
              trend: detectTrend(weeklyAvgEF.map(w => w.ef)),  // higher = improving
              avgDecoupling: decouplingValues.length > 0
                ? Math.round(avg(decouplingValues) * 10) / 10
                : null,
              decouplingTrend: detectTrend(decouplingValues.map(v => -v)),  // negate: lower % = improving
              runsWithoutSplitsData: runsWithoutSplits,
              splitsNote: runsWithoutSplits > 0
                ? `${runsWithoutSplits} easy run(s) lack cached splits — call get_activity_splits on those strava_ids to enable decoupling`
                : null,
            },

            cadence: {
              perRun: cadencePerRun,
              weeklyAvg: weeklyAvgCadence,
              trend: detectTrend(weeklyAvgCadence.map(w => w.cadence)),  // higher = improving
              recentAvg: recentCadenceAvg,
              distanceToTarget: recentCadenceAvg != null ? CADENCE_TARGET - recentCadenceAvg : null,
              consistencyScore,
            },

            hrDrift: {
              perRun: hrDriftPerRun,
              weeklyAvgDriftPerKm,
              trend: detectTrend(weeklyAvgDriftPerKm.map(w => -w.driftPerKm)),  // negate: lower drift = improving
              splitsNote: hrDriftPerRun.length === 0
                ? 'No cached split data — call get_activity_splits to enable HR drift analysis'
                : null,
            },

            trainingLoad: {
              acuteLoad: Math.round(atl * 10) / 10,
              chronicLoad: Math.round(ctl * 10) / 10,
              stressBalance,
              status: trainingLoadStatus,
              weeklyTSS: weeklyTSSArray,
              note: 'TSS uses simplified HR-zone method. CTL accuracy increases after 6+ weeks of data.',
            },

            sleepTrainingCorrelation,

            injuryRisk: {
              consecutiveRunDaysInLastWeek: maxConsecutive,
              weeklyMileageChangePct: mileageChangePct,
              cadenceDropFromBaseline,
              hrElevationFromBaseline,
              riskLevel,
              riskFactors,
            },

            compliance: {
              weekly: weeklyCompliance,
              avgCompliance,
              trend: detectTrend(weeklyCompliance.slice(-4).map(w => w.pct)),
            },
          }, null, 2),
        }],
      }
    }
  )
}
