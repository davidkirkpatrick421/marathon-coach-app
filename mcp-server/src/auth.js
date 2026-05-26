import supabase from './db/supabase.js'

const STRAVA_BASE = 'https://www.strava.com/api/v3'
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'
const PLAN_START = new Date('2026-05-11')

// ─── Token helpers ───────────────────────────────────────────────────────────

function getWeekNumber(activityDate) {
  const diff = new Date(activityDate) - PLAN_START
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

async function refreshStravaToken(refreshToken) {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete?.id ?? null,
  }
}

export async function getValidToken() {
  const { data: token, error } = await supabase
    .from('auth_tokens')
    .select('*')
    .single()

  if (error || !token) throw new Error('No auth token stored. Visit /auth/strava to connect.')

  if (token.expires_at < Math.floor(Date.now() / 1000)) {
    const refreshed = await refreshStravaToken(token.refresh_token)
    await supabase.from('auth_tokens').update({
      ...refreshed,
      updated_at: new Date().toISOString(),
    }).eq('id', token.id)
    return refreshed.access_token
  }

  return token.access_token
}

// ─── Activity ingestion ───────────────────────────────────────────────────────

function mapActivity(raw) {
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

async function backfillActivities(accessToken) {
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

// ─── Express route handlers ───────────────────────────────────────────────────

export function authRoutes(app) {
  // Step 1 — redirect user to Strava
  app.get('/auth/strava', (_req, res) => {
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      redirect_uri: `${process.env.APP_URL}/auth/callback`,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'activity:read_all',
    })
    res.redirect(`https://www.strava.com/oauth/authorize?${params}`)
  })

  // Step 2 — Strava redirects back with auth code
  app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query

    if (error || !code) {
      return res.status(400).json({ error: error ?? 'No code returned from Strava' })
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
        }),
      })
      if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`)
      const tokenData = await tokenRes.json()

      const tokenRow = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        athlete_id: tokenData.athlete?.id ?? null,
        updated_at: new Date().toISOString(),
      }

      // Upsert — always keep single row (personal app)
      const { data: existing } = await supabase
        .from('auth_tokens')
        .select('id')
        .single()

      if (existing) {
        await supabase.from('auth_tokens').update(tokenRow).eq('id', existing.id)
      } else {
        await supabase.from('auth_tokens').insert(tokenRow)
      }

      // Backfill activities since plan start
      const count = await backfillActivities(tokenData.access_token)

      res.json({
        status: 'connected',
        athlete_id: tokenData.athlete?.id,
        activities_imported: count,
      })
    } catch (err) {
      console.error('Auth callback error:', err)
      res.status(500).json({ error: err.message })
    }
  })
}
