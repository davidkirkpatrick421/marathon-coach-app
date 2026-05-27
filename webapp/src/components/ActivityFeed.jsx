import { formatDate, formatPace, formatDuration, formatDistance } from '../lib/formatters.js'

const TYPE_COLOR = {
  Run:           'text-orange-400',
  Ride:          'text-blue-400',
  Walk:          'text-emerald-400',
  WeightTraining:'text-purple-400',
  StairStepper:  'text-cyan-400',
  Workout:       'text-slate-400',
}

export default function ActivityFeed({ activities, loading }) {
  if (loading) {
    return <div className="bg-slate-900 border border-slate-800 rounded-lg h-40 animate-pulse" />
  }
  if (!activities.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-600">
        No activities yet
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800/60">
      {activities.map(a => (
        <div key={a.id} className="px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-mono font-medium ${TYPE_COLOR[a.activity_type] ?? 'text-slate-400'}`}>
              {a.activity_type}
            </span>
            <span className="text-xs font-mono text-slate-500">{formatDate(a.date)}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-mono text-slate-200">{formatDistance(a.distance_km)}</span>
            {a.activity_type === 'Run' && a.avg_pace_per_km && (
              <span className="text-xs font-mono text-slate-400">{formatPace(a.avg_pace_per_km)}</span>
            )}
            {a.avg_hr && <span className="text-xs font-mono text-slate-400">{a.avg_hr} bpm</span>}
            {a.avg_cadence && <span className="text-xs font-mono text-slate-400">{a.avg_cadence} spm</span>}
            <span className="ml-auto text-xs font-mono text-slate-600">{formatDuration(a.duration_seconds)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
