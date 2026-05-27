import { z } from 'zod'
import supabase from '../db/supabase.js'
import { getValidToken } from '../strava/auth.js'

const STRAVA_BASE = 'https://www.strava.com/api/v3'

function formatPace(speedMps) {
  if (!speedMps || speedMps === 0) return null
  const paceMin = (1000 / 60) / speedMps
  const mins = Math.floor(paceMin)
  const secs = Math.round((paceMin - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatStoredPace(paceMinKm) {
  if (!paceMinKm) return null
  const mins = Math.floor(paceMinKm)
  const secs = Math.round((paceMinKm - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatSplits(splits) {
  return splits.map(s => ({
    km: s.split,
    pace: formatPace(s.average_speed),
    avg_hr: s.average_heartrate != null ? Math.round(s.average_heartrate) : null,
    elevation_diff_m: s.elevation_difference != null ? Math.round(s.elevation_difference * 10) / 10 : null,
    pace_zone: s.pace_zone ?? null,
    moving_time_sec: s.moving_time ?? null,
  }))
}

async function fetchAndStoreSplits(stravaId, activityDbId) {
  const accessToken = await getValidToken()
  const res = await fetch(`${STRAVA_BASE}/activities/${stravaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava API returned ${res.status}`)
  const detail = await res.json()

  await supabase
    .from('activities')
    .update({ raw_data: detail })
    .eq('id', activityDbId)

  return detail.splits_metric ?? null
}

export function registerSplitsTool(server) {
  server.tool(
    'get_activity_splits',
    'Get per-kilometre split data for a specific activity: pace, heart rate, and elevation change per km. Use the strava_id returned by get_recent_activities. If splits are not cached, fetches from Strava automatically and stores the result.',
    {
      strava_id: z.number().int().describe('Strava activity ID (from get_recent_activities)'),
    },
    async ({ strava_id }) => {
      const { data: activity, error } = await supabase
        .from('activities')
        .select('id, name, date, distance_km, activity_type, avg_pace_per_km, avg_hr, avg_cadence, raw_data')
        .eq('strava_id', strava_id)
        .single()

      if (error || !activity) {
        return { content: [{ type: 'text', text: `Activity ${strava_id} not found in database.` }] }
      }

      let splits = activity.raw_data?.splits_metric ?? null

      if (!splits) {
        try {
          splits = await fetchAndStoreSplits(strava_id, activity.id)
        } catch (err) {
          return { content: [{ type: 'text', text: `Could not fetch splits from Strava: ${err.message}` }] }
        }
      }

      if (!splits || splits.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No split data available for "${activity.name}" (${activity.date?.split('T')[0]}). Activity may lack GPS data.`,
          }],
        }
      }

      const formattedSplits = formatSplits(splits)
      const paces = formattedSplits.map(s => s.avg_hr).filter(Boolean)
      const hrs = formattedSplits.map(s => s.avg_hr).filter(Boolean)

      const result = {
        activity: {
          name: activity.name,
          date: activity.date?.split('T')[0],
          distance_km: activity.distance_km ? parseFloat(activity.distance_km) : null,
          overall_avg_pace: formatStoredPace(activity.avg_pace_per_km ? parseFloat(activity.avg_pace_per_km) : null),
          overall_avg_hr: activity.avg_hr,
          overall_avg_cadence: activity.avg_cadence,
        },
        splits: formattedSplits,
        summary: {
          first_km_pace: formattedSplits[0]?.pace ?? null,
          last_km_pace: formattedSplits[formattedSplits.length - 1]?.pace ?? null,
          first_km_hr: formattedSplits[0]?.avg_hr ?? null,
          last_km_hr: formattedSplits[formattedSplits.length - 1]?.avg_hr ?? null,
          hr_drift_bpm: hrs.length >= 2 ? hrs[hrs.length - 1] - hrs[0] : null,
        },
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )
}
