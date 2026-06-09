import { formatDate, formatPace, formatDuration, formatDistance } from '../lib/formatters.js'

const TYPE_META = {
  Run:           { icon: 'directions_run',  color: 'text-phase-aerobic',    bg: 'bg-phase-aerobic/20'    },
  TrailRun:      { icon: 'directions_run',  color: 'text-phase-aerobic',    bg: 'bg-phase-aerobic/20'    },
  VirtualRun:    { icon: 'directions_run',  color: 'text-phase-aerobic',    bg: 'bg-phase-aerobic/20'    },
  Ride:          { icon: 'directions_bike', color: 'text-phase-foundation', bg: 'bg-phase-foundation/20' },
  Walk:          { icon: 'directions_walk', color: 'text-success-green',    bg: 'bg-success-green/20'    },
  WeightTraining:{ icon: 'fitness_center',  color: 'text-phase-build',      bg: 'bg-phase-build/20'      },
  StairStepper:  { icon: 'stairs',          color: 'text-tertiary',         bg: 'bg-tertiary/20'         },
  Workout:       { icon: 'sports',          color: 'text-on-surface-variant',bg: 'bg-surface-container-highest'},
}

function getTypeMeta(type) {
  return TYPE_META[type] ?? { icon: 'sports', color: 'text-on-surface-variant', bg: 'bg-surface-container-highest' }
}

function StatCell({ label, value }) {
  return (
    <div>
      <div className="font-label-mono text-label-mono text-on-surface-variant">{label}</div>
      <div className="font-body-lg text-body-lg text-on-surface">{value}</div>
    </div>
  )
}

export default function ActivityFeed({ activities, loading }) {
  if (loading) {
    return <div className="bg-surface-container-low rounded-xl border border-white/5 h-40 animate-pulse" />
  }
  if (!activities.length) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-white/5 p-6">
        <span className="font-label-mono text-label-mono text-on-surface-variant/50">No activities yet</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map(a => {
        const { icon, color, bg } = getTypeMeta(a.activity_type)
        return (
          <div
            key={a.id}
            className="bg-surface-container-low rounded-xl p-4 border border-white/5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center ${color} shrink-0`}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <div>
                  <div className={`font-body-md text-body-md font-semibold ${color}`}>
                    {a.activity_type}
                  </div>
                  <div className="font-label-mono text-label-mono text-on-surface-variant">
                    {formatDate(a.date)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {a.distance_km && (
                  <div className="font-body-md text-body-md font-semibold text-on-surface">
                    {formatDistance(a.distance_km)}
                  </div>
                )}
                {a.duration_seconds && (
                  <div className="font-label-mono text-label-mono text-on-surface-variant">
                    {formatDuration(a.duration_seconds)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {a.activity_type === 'Run' && a.avg_pace_per_km
                ? <StatCell label="Pace" value={formatPace(a.avg_pace_per_km)} />
                : <StatCell label="Distance" value={formatDistance(a.distance_km)} />
              }
              <StatCell label="Avg HR" value={a.avg_hr ? `${a.avg_hr} bpm` : '—'} />
              <StatCell label="Cadence" value={a.avg_cadence ? `${a.avg_cadence} spm` : '—'} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
