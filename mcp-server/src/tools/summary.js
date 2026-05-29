import supabase from '../db/supabase.js'

const PLAN_START = new Date('2026-05-05')

function currentWeekNumber() {
  const diff = Date.now() - PLAN_START.getTime()
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1)
}

export function registerSummaryTool(server) {
  server.tool(
    'get_training_context',
    'Get the current training plan context: phase, week number, this week\'s target vs actual km, recent weekly totals, latest check-in, and known health concerns. Call this at the start of any coaching conversation.',
    {},
    async () => {
      const weekNum = currentWeekNumber()

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun']

      const [
        { data: weekActivities },
        { data: planWeek },
        { data: recentRuns },
        { data: phase },
        { data: checkin },
        { data: garminMetrics },
        { data: garminSyncStatus },
        { data: crossTraining },
      ] = await Promise.all([
        supabase
          .from('activities')
          .select('date, distance_km, duration_seconds, avg_pace_per_km, avg_hr, avg_cadence')
          .in('activity_type', RUN_TYPES)
          .eq('week_number', weekNum),
        supabase
          .from('plan_weeks')
          .select('total_target_km, run1_target_km, run2_target_km, long_run_target_km, is_deload, notes')
          .eq('week_number', weekNum)
          .single(),
        supabase
          .from('activities')
          .select('week_number, distance_km')
          .in('activity_type', RUN_TYPES)
          .gte('week_number', weekNum - 4)
          .lt('week_number', weekNum),
        supabase
          .from('plan_phases')
          .select('phase_number, name, start_date, end_date, goal')
          .eq('active', true)
          .single(),
        supabase
          .from('checkins')
          .select('week_number, calf_status, knee_status, energy_level, motivation_level, avg_sleep_score, avg_sleep_hrs, session_feedback, coaching_questions')
          .order('date', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('garmin_metrics')
          .select('date, sleep_score, sleep_duration_hrs, resting_hr, hrv_7day_avg, hrv_status, body_battery_morning')
          .gte('date', sevenDaysAgo)
          .order('date', { ascending: false }),
        supabase
          .from('garmin_sync_status')
          .select('last_attempted_at, last_succeeded_at, last_error')
          .eq('id', 1)
          .single(),
        supabase
          .from('activities')
          .select('strava_id, date, name, activity_type, distance_km, duration_seconds, elevation_gain, calories, week_number')
          .not('activity_type', 'in', `(${RUN_TYPES.join(',')})`)
          .gte('week_number', weekNum - 3)
          .order('date', { ascending: false }),
      ])

      // Aggregate last 4 weeks into week totals
      const weekTotals = {}
      for (const a of (recentRuns ?? [])) {
        weekTotals[a.week_number] = (weekTotals[a.week_number] ?? 0) + parseFloat(a.distance_km ?? 0)
      }

      const thisWeekKm = (weekActivities ?? []).reduce(
        (sum, a) => sum + parseFloat(a.distance_km ?? 0), 0
      )

      const context = {
        plan: {
          race: 'Belfast Marathon — May 2027',
          goals: { northStar: 'Sub-3:00', A: '3:15–3:30', B: '3:45–4:00' },
          startDate: '2026-05-05',
          totalWeeks: 52,
        },
        currentWeek: {
          number: weekNum,
          runsCompleted: weekActivities?.length ?? 0,
          kmCompleted: Math.round(thisWeekKm * 10) / 10,
          targetKm: planWeek?.total_target_km ? parseFloat(planWeek.total_target_km) : null,
          run1TargetKm: planWeek?.run1_target_km ? parseFloat(planWeek.run1_target_km) : null,
          run2TargetKm: planWeek?.run2_target_km ? parseFloat(planWeek.run2_target_km) : null,
          longRunTargetKm: planWeek?.long_run_target_km ? parseFloat(planWeek.long_run_target_km) : null,
          isDeload: planWeek?.is_deload ?? false,
          planNotes: planWeek?.notes ?? null,
          runs: (weekActivities ?? []).map(a => ({
            date: a.date,
            distance_km: a.distance_km ? parseFloat(a.distance_km) : null,
            duration_min: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
            avg_pace_per_km: a.avg_pace_per_km ? parseFloat(a.avg_pace_per_km) : null,
            avg_hr: a.avg_hr,
            avg_cadence: a.avg_cadence,
          })),
        },
        currentPhase: phase ?? { phase_number: 1, name: 'Foundation', goal: 'Build aerobic base — easy running only' },
        recentWeekTotals: Object.entries(weekTotals)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, km]) => ({ week: Number(week), km: Math.round(km * 10) / 10 })),
        latestCheckin: checkin ?? null,
        garminSync: garminSyncStatus
          ? {
              lastAttempted: garminSyncStatus.last_attempted_at,
              lastSucceeded: garminSyncStatus.last_succeeded_at,
              lastError: garminSyncStatus.last_error ?? null,
            }
          : null,
        garminRecent: (garminMetrics ?? []).map(g => ({
          date: g.date,
          sleep_score: g.sleep_score,
          sleep_duration_hrs: g.sleep_duration_hrs ? parseFloat(g.sleep_duration_hrs) : null,
          resting_hr: g.resting_hr,
          hrv_7day_avg: g.hrv_7day_avg,
          hrv_status: g.hrv_status,
          body_battery_morning: g.body_battery_morning,
        })),
        recentCrossTraining: (crossTraining ?? []).map(a => ({
          strava_id: a.strava_id,
          date: a.date,
          name: a.name,
          activity_type: a.activity_type,
          distance_km: a.distance_km ? parseFloat(a.distance_km) : null,
          duration_min: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
          elevation_gain: a.elevation_gain,
          calories: a.calories,
          week_number: a.week_number,
        })),
        healthNotes: {
          knownConcerns: ['left posterior tibialis', 'heel-to-midfoot gait transition', 'sleep quality'],
          trainingSchedule: '2–3 runs/week + gym 1–2x + Pilates Wednesday + cycling',
        },
      }

      return { content: [{ type: 'text', text: JSON.stringify(context, null, 2) }] }
    }
  )
}
