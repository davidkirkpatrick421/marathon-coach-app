import { useGarminMetrics } from '../hooks/useGarminMetrics.js'

function batteryColor(v) {
  if (v == null) return 'neutral'
  return v > 80 ? 'green' : v >= 60 ? 'amber' : 'red'
}
function sleepColor(v) {
  if (v == null) return 'neutral'
  return v > 75 ? 'green' : v >= 60 ? 'amber' : 'red'
}
function hrvColor(status) {
  if (!status) return 'neutral'
  const s = status.toUpperCase()
  if (s === 'BALANCED') return 'green'
  if (s === 'UNBALANCED') return 'amber'
  return 'red'
}
function hrDeltaColor(delta) {
  if (delta == null) return 'neutral'
  return delta > 5 ? 'red' : delta > 2 ? 'amber' : 'green'
}

const VALUE_COLOR = {
  green:   'text-success-green',
  amber:   'text-primary',
  red:     'text-error',
  neutral: 'text-on-surface',
}

function Chip({ icon, label, value, color, sub }) {
  const valueCls = VALUE_COLOR[color] ?? VALUE_COLOR.neutral
  return (
    <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="font-label-mono text-[10px] tracking-widest uppercase">{label}</span>
      </div>
      <div className={`font-headline-md text-headline-md ${valueCls}`}>{value}</div>
      {sub && <div className="font-label-mono text-label-mono text-on-surface-variant/60">{sub}</div>}
    </div>
  )
}

export default function ReadinessPanel() {
  const { metrics, loading } = useGarminMetrics()

  if (loading) {
    return <div className="bg-surface-container-low rounded-xl border border-white/5 h-36 animate-pulse" />
  }

  const today = metrics[0] ?? null
  const prev  = metrics[1] ?? null
  const sleepSource = (today?.sleep_score != null) ? today : prev
  const m = today ? {
    ...today,
    sleep_score:  today.sleep_score  ?? sleepSource?.sleep_score,
    resting_hr:   today.resting_hr   ?? sleepSource?.resting_hr,
    hrv_status:   today.hrv_status   ?? sleepSource?.hrv_status,
    hrv_7day_avg: today.hrv_7day_avg ?? sleepSource?.hrv_7day_avg,
  } : null

  if (!today) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-white/5 p-6">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-3">
          Today's Readiness
        </div>
        <div className="font-label-mono text-label-mono text-on-surface-variant/50">
          No Garmin data yet — syncs at 09:00 BST
        </div>
      </div>
    )
  }

  const prevHr = metrics.slice(1).filter(x => x.resting_hr != null).map(x => x.resting_hr)
  const avgRestingHr = prevHr.length
    ? Math.round(prevHr.reduce((a, b) => a + b, 0) / prevHr.length)
    : null
  const hrDelta = m.resting_hr != null && avgRestingHr != null ? m.resting_hr - avgRestingHr : null

  const dataDate = new Date(today.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Today's Readiness
        </div>
        <div className="font-label-mono text-label-mono text-on-surface-variant/50">{dataDate}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Chip
          icon="battery_charging_full"
          label="Body Battery"
          value={m.body_battery_morning != null ? `${m.body_battery_morning}%` : '—'}
          color={batteryColor(m.body_battery_morning)}
        />
        <Chip
          icon="bedtime"
          label="Sleep Score"
          value={m.sleep_score != null ? String(m.sleep_score) : '—'}
          color={sleepColor(m.sleep_score)}
        />
        <Chip
          icon="monitor_heart"
          label="HRV Status"
          value={m.hrv_status ?? '—'}
          color={hrvColor(m.hrv_status)}
        />
        <Chip
          icon="favorite"
          label="Resting HR"
          value={m.resting_hr != null ? `${m.resting_hr} bpm` : '—'}
          color={hrDeltaColor(hrDelta)}
          sub={hrDelta != null
            ? `${hrDelta > 0 ? '+' : ''}${hrDelta} vs 7-day avg`
            : avgRestingHr != null ? `avg ${avgRestingHr} bpm` : ''}
        />
      </div>
    </div>
  )
}
