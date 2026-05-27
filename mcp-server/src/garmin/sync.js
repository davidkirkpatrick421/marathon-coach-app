import { getGarminClient, clearGarminClient, persistTokens } from './client.js'
import supabase from '../db/supabase.js'

export async function syncGarminDay(dateStr) {
  let client
  try {
    client = await getGarminClient()
  } catch (err) {
    console.error('[Garmin] Cannot get client:', err.message)
    return null
  }

  const date = new Date(dateStr + 'T12:00:00Z') // noon UTC avoids timezone edge cases

  // Fetch all three in parallel — partial success is fine
  const [sleepResult, hrvResult, bodyBatteryResult] = await Promise.allSettled([
    client.getSleepData(date),
    client.getHRVData(date),
    client.getBodyBattery(dateStr, dateStr)
  ])

  const sleep = sleepResult.status === 'fulfilled' ? sleepResult.value : null
  const hrv = hrvResult.status === 'fulfilled' ? hrvResult.value : null
  const bodyBattery = bodyBatteryResult.status === 'fulfilled' ? bodyBatteryResult.value : null

  if (sleepResult.status === 'rejected') console.warn(`[Garmin] Sleep failed ${dateStr}:`, sleepResult.reason?.message)
  if (hrvResult.status === 'rejected') console.warn(`[Garmin] HRV failed ${dateStr}:`, hrvResult.reason?.message)
  if (bodyBatteryResult.status === 'rejected') console.warn(`[Garmin] Body battery failed ${dateStr}:`, bodyBatteryResult.reason?.message)

  // SleepData has restingHeartRate, avgOvernightHrv, and hrvStatus directly
  const bbEntry = Array.isArray(bodyBattery) ? bodyBattery.find(e => e.calendarDate === dateStr) : null

  const metrics = {
    date: dateStr,
    sleep_score:         sleep?.dailySleepDTO?.sleepScores?.overall?.value ?? null,
    sleep_duration_hrs:  sleep?.dailySleepDTO?.sleepTimeSeconds
      ? parseFloat((sleep.dailySleepDTO.sleepTimeSeconds / 3600).toFixed(2))
      : null,
    resting_hr:          sleep?.restingHeartRate ?? null,
    hrv_7day_avg:        hrv?.hrvSummary?.weeklyAvg
      ? Math.round(hrv.hrvSummary.weeklyAvg)
      : null,
    hrv_status:          hrv?.hrvSummary?.status ?? sleep?.hrvStatus ?? null,
    // highBodyBattery = morning peak (charged after sleep); lowBodyBattery = end-of-day minimum
    body_battery_morning: bbEntry?.values?.highBodyBattery ?? null
  }

  const hasData = Object.entries(metrics)
    .filter(([k]) => k !== 'date')
    .some(([, v]) => v !== null)

  if (!hasData) {
    console.log(`[Garmin] No data for ${dateStr} — skipping upsert`)
    return null
  }

  const { error } = await supabase
    .from('garmin_metrics')
    .upsert(metrics, { onConflict: 'date' })

  if (error) {
    console.error(`[Garmin] Upsert failed for ${dateStr}:`, error.message)
    return null
  }

  console.log(`[Garmin] Synced ${dateStr}:`, JSON.stringify(metrics))
  return metrics
}

export async function syncGarminRecent(days = 7) {
  const results = []

  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    try {
      const result = await syncGarminDay(dateStr)
      if (result) results.push(result)
    } catch (err) {
      console.error(`[Garmin] Sync failed for ${dateStr}:`, err.message)
      // Clear cached client — stale token may need refresh
      clearGarminClient()
    }
  }

  console.log(`[Garmin] Synced ${results.length}/${days} days`)

  // Persist any refreshed tokens back to Supabase after each sync run
  if (results.length > 0) {
    const client = await getGarminClient().catch(() => null)
    if (client) await persistTokens(client)
  }

  return results
}
