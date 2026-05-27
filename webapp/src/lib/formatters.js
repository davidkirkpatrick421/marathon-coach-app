export function formatPace(decimalMinutes) {
  const val = parseFloat(decimalMinutes)
  if (!val || isNaN(val)) return '—'
  const mins = Math.floor(val)
  const secs = Math.round((val - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}/km`
}

export function formatDuration(seconds) {
  if (seconds == null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDistance(km) {
  const val = parseFloat(km)
  if (!val || isNaN(val)) return '—'
  return `${val.toFixed(2)}km`
}
