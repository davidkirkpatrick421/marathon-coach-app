import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

function normalize(row) {
  const toNum = (val) => {
    const n = parseFloat(val)
    return Number.isNaN(n) ? null : n
  }
  const fmtRun = (val) => val !== null ? `${val}km easy` : '—'
  const fmtKm = (val) => val !== null ? `${val}km` : '—'

  const run1Km = toNum(row.run1_target_km)
  const run2Km = toNum(row.run2_target_km)
  const longRunKm = toNum(row.long_run_target_km)
  const totalKm = (run1Km || 0) + (run2Km || 0) + (longRunKm || 0)

  return {
    week: row.week_number,
    run1: fmtRun(run1Km),
    run2: fmtRun(run2Km),
    longRun: fmtRun(longRunKm),
    total: totalKm > 0 ? `${totalKm}km` : '—',
    targetRunCount: [run1Km, run2Km, longRunKm].filter(v => v !== null).length,
    gym: row.gym_session,
    cycling: fmtKm(toNum(row.cycling_target_km)),
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
