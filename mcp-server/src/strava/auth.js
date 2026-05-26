import supabase from '../db/supabase.js'
import { backfillActivities } from './activities.js'

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token'

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

export function authRoutes(app) {
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

  app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query

    if (error || !code) {
      return res.status(400).json({ error: error ?? 'No code returned from Strava' })
    }

    try {
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

      const { data: existing } = await supabase
        .from('auth_tokens')
        .select('id')
        .single()

      if (existing) {
        await supabase.from('auth_tokens').update(tokenRow).eq('id', existing.id)
      } else {
        await supabase.from('auth_tokens').insert(tokenRow)
      }

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
