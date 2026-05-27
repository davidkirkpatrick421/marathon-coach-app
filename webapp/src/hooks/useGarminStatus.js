import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useGarminStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('garmin_sync_status')
      .select('last_attempted_at, last_succeeded_at, last_error')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setStatus(data ?? null)
        setLoading(false)
      })
  }, [])

  return { status, loading }
}
