import { useGarminMetrics } from '../hooks/useGarminMetrics.js'

const COLORS = {
  green:   { text: 'text-emerald-400', dot: 'text-emerald-400' },
  amber:   { text: 'text-amber-400',   dot: 'text-amber-400'   },
  red:     { text: 'text-red-400',     dot: 'text-red-400'     },
  neutral: { text: 'text-slate-300',   dot: 'text-slate-700'   },
}

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

function Dots({ count, color }) {
  const cls = COLORS[color]?.dot ?? COLORS.neutral.dot
  return (
    <span className="tracking-widest font-mono text-xs leading-none">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? cls : 'text-slate-700'}>
          {i < count ? '●' : '○'}
        </span>
      ))}
    </span>
  )
}

function Row({ label, value, color, dotCount, sub }) {
  const textCls = COLORS[color]?.text ?? COLORS.neutral.text
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-slate-500 w-24 shrink-0">{label}</span>
      <span className={`text-sm font-mono font-medium ${textCls} w-20 shrink-0`}>{value}</span>
      <span className="ml-auto">
        {dotCount != null
          ? <Dots count={dotCount} color={color} />
          : <span className="text-xs font-mono text-slate-600">{sub ?? ''}</span>
        }
      </span>
    </div>
  )
}

export default function ReadinessPanel() {
  const { metrics, loading } = useGarminMetrics()

  if (loading) {
    return <div className="bg-slate-900 border border-slate-800 rounded-lg h-36 animate-pulse" />
  }

  const today = metrics[0] ?? null

  if (!today) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-3">Today's Readiness</div>
        <div className="text-xs font-mono text-slate-600">No Garmin data yet — syncs at 09:00 BST</div>
      </div>
    )
  }

  // 7-day avg resting HR from previous days (exclude today to avoid circularity)
  const prevHr = metrics.slice(1).filter(m => m.resting_hr != null).map(m => m.resting_hr)
  const avgRestingHr = prevHr.length
    ? Math.round(prevHr.reduce((a, b) => a + b, 0) / prevHr.length)
    : null
  const hrDelta = today.resting_hr != null && avgRestingHr != null
    ? today.resting_hr - avgRestingHr
    : null

  const dataDate = new Date(today.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">Today's Readiness</div>
        <div className="text-xs font-mono text-slate-700">{dataDate}</div>
      </div>

      <div className="space-y-3">
        <Row
          label="Body Battery"
          value={today.body_battery_morning != null ? `${today.body_battery_morning}%` : '—'}
          color={batteryColor(today.body_battery_morning)}
          dotCount={today.body_battery_morning != null
            ? Math.min(5, Math.round(today.body_battery_morning / 20))
            : null}
        />
        <Row
          label="Sleep Score"
          value={today.sleep_score != null ? String(today.sleep_score) : '—'}
          color={sleepColor(today.sleep_score)}
          dotCount={today.sleep_score != null
            ? Math.min(5, Math.round(today.sleep_score / 20))
            : null}
        />
        <Row
          label="HRV Status"
          value={today.hrv_status ?? '—'}
          color={hrvColor(today.hrv_status)}
        />
        <Row
          label="Resting HR"
          value={today.resting_hr != null ? `${today.resting_hr} bpm` : '—'}
          color={hrDeltaColor(hrDelta)}
          sub={hrDelta != null
            ? `${hrDelta > 0 ? '+' : ''}${hrDelta} vs 7-day avg`
            : avgRestingHr != null ? `avg ${avgRestingHr} bpm` : ''}
        />
      </div>
    </div>
  )
}
