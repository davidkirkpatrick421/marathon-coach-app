import { useGarminStatus } from '../hooks/useGarminStatus.js'

function timeAgo(isoString) {
  if (!isoString) return null
  const diffMs = Date.now() - new Date(isoString).getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return 'less than 1h ago'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function GarminSyncBadge() {
  const { status, loading } = useGarminStatus()

  if (loading || !status) return null

  const succeededAt = status.last_succeeded_at ? new Date(status.last_succeeded_at) : null
  const hoursSinceSuccess = succeededAt
    ? (Date.now() - succeededAt.getTime()) / (1000 * 60 * 60)
    : Infinity

  const isStale = hoursSinceSuccess > 26
  const isFailed = !succeededAt || (status.last_error && new Date(status.last_attempted_at) > succeededAt)

  const dotColor = isFailed || isStale
    ? (hoursSinceSuccess > 48 ? 'bg-red-500' : 'bg-amber-500')
    : 'bg-emerald-500'

  const label = isFailed
    ? `Garmin sync failed · last ok ${timeAgo(status.last_succeeded_at) ?? 'never'}`
    : isStale
    ? `Garmin sync stale · last ok ${timeAgo(status.last_succeeded_at)}`
    : `Garmin synced ${timeAgo(status.last_succeeded_at)}`

  return (
    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
      {isFailed && status.last_error && (
        <span className="text-slate-700 truncate max-w-xs hidden sm:block">— {status.last_error}</span>
      )}
    </div>
  )
}
