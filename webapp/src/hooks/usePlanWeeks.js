import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function normalize(row) {
  const km = (val) => {
    const n = parseFloat(val)
    return Number.isNaN(n) ? '—' : `${n}km`
  }
  return {
    week: row.week_number,
    run1: `${parseFloat(row.run1_target_km)}km easy`,
    run2: `${parseFloat(row.run2_target_km)}km easy`,
    longRun: `${parseFloat(row.long_run_target_km)}km easy`,
    total: km(row.total_target_km),
    gym: row.gym_session,
    cycling: km(row.cycling_target_km),
    deload: row.is_deload,
    notes: row.notes ?? null,
  }
}

export function usePlanWeeks(maxWeek = 16) {
  const [weeks, setWeeks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('plan_weeks')
      .select('week_number, run1_target_km, run2_target_km, long_run_target_km, total_target_km, gym_session, cycling_target_km, is_deload, notes')
      .lte('week_number', maxWeek)
      .order('week_number', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data?.length) setWeeks(data.map(normalize))
        setLoading(false)
      })
  }, [maxWeek])

  return { weeks, loading }
}
