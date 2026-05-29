import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useGarminMetrics() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    supabase
      .from('garmin_metrics')
      .select('date, sleep_score, sleep_duration_hrs, resting_hr, hrv_7day_avg, hrv_status, body_battery_morning')
      .gte('date', eightDaysAgo)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setMetrics(data ?? [])
        setLoading(false)
      })
  }, [])

  return { metrics, loading }
}
