import { GarminConnect } from '@gooin/garmin-connect'
import supabase from '../db/supabase.js'

// Module-level cache — lives for the server process lifetime
let garminClient = null

export async function getGarminClient() {
  if (garminClient) return garminClient

  const email = process.env.GARMIN_EMAIL || 'placeholder@placeholder.com'
  const password = process.env.GARMIN_PASSWORD || 'placeholder'

  const GCClient = new GarminConnect({ username: email, password })

  // Try restoring from tokens saved in Supabase
  const { data: tokenRow } = await supabase
    .from('garmin_tokens')
    .select('oauth1_token, oauth2_token')
    .eq('id', 1)
    .single()

  if (tokenRow?.oauth1_token && tokenRow?.oauth2_token) {
    try {
      GCClient.loadToken(tokenRow.oauth1_token, tokenRow.oauth2_token)
      await GCClient.getUserProfile()
      console.log('[Garmin] Session restored from saved tokens')
      garminClient = GCClient
      return garminClient
    } catch (err) {
      console.warn('[Garmin] Saved tokens invalid, falling back to login:', err.message)
    }
  }

  // Fall back to credential login
  if (!process.env.GARMIN_EMAIL || !process.env.GARMIN_PASSWORD) {
    throw new Error('Garmin credentials not set — add GARMIN_EMAIL and GARMIN_PASSWORD env vars, or seed tokens via POST /admin/garmin/auth')
  }

  await GCClient.login()
  console.log('[Garmin] Logged in with credentials, saving tokens')
  await persistTokens(GCClient)

  garminClient = GCClient
  return garminClient
}

export async function persistTokens(GCClient) {
  const tokens = GCClient.exportToken()
  const { error } = await supabase.from('garmin_tokens').upsert({
    id: 1,
    oauth1_token: tokens.oauth1,
    oauth2_token: tokens.oauth2,
    updated_at: new Date().toISOString()
  })
  if (error) console.error('[Garmin] Failed to persist tokens:', error.message)
}

export function clearGarminClient() {
  garminClient = null
}
