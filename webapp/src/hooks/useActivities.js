import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useActivities(limit = 100) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setActivities(data ?? [])
        setLoading(false)
      })
  }, [limit])

  return { activities, loading, error }
}
