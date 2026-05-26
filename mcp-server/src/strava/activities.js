import supabase from '../db/supabase.js'

const STRAVA_BASE = 'https://www.strava.com/api/v3'
const PLAN_START = new Date('2026-05-11')

export function getWeekNumber(activityDate) {
  const diff = new Date(activityDate) - PLAN_START
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

export function mapActivity(raw) {
  const speedMps = raw.average_speed ?? 0
  const avgPace = speedMps > 0 ? (1000 / 60) / speedMps : null

  return {
    strava_id: raw.id,
    activity_type: raw.type,
    date: raw.start_date,
    distance_km: raw.distance != null ? raw.distance / 1000 : null,
    duration_seconds: raw.moving_time ?? null,
    avg_pace_per_km: avgPace,
    avg_hr: raw.average_heartrate ?? null,
    max_hr: raw.max_heartrate ?? null,
    avg_cadence: raw.average_cadence != null ? raw.average_cadence * 2 : null,
    elevation_gain: raw.total_elevation_gain ?? null,
    calories: raw.calories ?? null,
    week_number: getWeekNumber(raw.start_date),
    raw_data: raw,
  }
}

export async function backfillActivities(accessToken) {
  const after = Math.floor(PLAN_START.getTime() / 1000)
  const res = await fetch(
    `${STRAVA_BASE}/athlete/activities?per_page=200&after=${after}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`)

  const activities = await res.json()
  if (!activities.length) return 0

  const rows = activities.map(mapActivity)

  const { error } = await supabase
    .from('activities')
    .upsert(rows, { onConflict: 'strava_id' })

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`)
  return rows.length
}
