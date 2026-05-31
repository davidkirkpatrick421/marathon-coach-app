import { getValidToken } from './auth.js'
import { mapActivity } from './activities.js'
import supabase from '../db/supabase.js'

const STRAVA_BASE = 'https://www.strava.com/api/v3'

async function fetchFullActivity(stravaId, accessToken) {
  const res = await fetch(`${STRAVA_BASE}/activities/${stravaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Strava activity fetch failed: ${res.status}`)
  return res.json()
}

export function webhookRoutes(app) {
  // Strava sends a GET to validate the endpoint during webhook registration
  app.get('/webhooks/strava', (req, res) => {
    const challenge = req.query['hub.challenge']
    const verifyToken = req.query['hub.verify_token']

    if (verifyToken !== process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
      return res.status(403).json({ error: 'Invalid verify token' })
    }

    res.json({ 'hub.challenge': challenge })
  })

  // Strava calls this when a new activity is created
  app.post('/webhooks/strava', async (req, res) => {
    // Acknowledge immediately — Strava expects a fast 200
    res.sendStatus(200)

    const { object_type, aspect_type, object_id } = req.body

    if (object_type !== 'activity' || aspect_type !== 'create') return

    try {
      const accessToken = await getValidToken()
      const raw = await fetchFullActivity(object_id, accessToken)
      const row = mapActivity(raw)

      const { error } = await supabase
        .from('activities')
        .upsert(row, { onConflict: 'strava_id' })

      if (error) console.error('Webhook upsert error:', error.message)
      else console.log(`Webhook: synced activity ${object_id} (${row.activity_type} ${row.distance_km}km)`)
    } catch (err) {
      console.error('Webhook handler error:', err.message)
    }
  })
}
