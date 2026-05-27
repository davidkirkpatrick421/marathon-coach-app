import { z } from 'zod'
import supabase from '../db/supabase.js'

export function registerActivitiesTool(server) {
  server.tool(
    'get_recent_activities',
    'Get recent training activities synced from Strava. Returns runs, rides, and other workouts with pace, HR, cadence, and week number.',
    { count: z.number().int().min(1).max(30).optional().describe('Number of activities to return (default 10, max 30)') },
    async ({ count = 10 }) => {
      const { data, error } = await supabase
        .from('activities')
        .select('strava_id, date, name, activity_type, distance_km, duration_seconds, avg_pace_per_km, avg_hr, max_hr, avg_cadence, elevation_gain, calories, week_number')
        .order('date', { ascending: false })
        .limit(count)

      if (error) return { content: [{ type: 'text', text: `Error fetching activities: ${error.message}` }] }
      if (!data.length) return { content: [{ type: 'text', text: 'No activities found.' }] }

      const formatted = data.map(a => ({
        ...a,
        distance_km: a.distance_km ? parseFloat(a.distance_km) : null,
        avg_pace_per_km: a.avg_pace_per_km ? parseFloat(a.avg_pace_per_km) : null,
        duration_min: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
      }))

      return { content: [{ type: 'text', text: JSON.stringify(formatted, null, 2) }] }
    }
  )
}
