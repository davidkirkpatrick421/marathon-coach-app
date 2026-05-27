import { useMemo } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { phase1Weeks, getWeekDates } from '../lib/data.js'
import SectionLabel from '../components/SectionLabel.jsx'

export default function Phase1({ currentWeek }) {
  const { activities } = useActivities()

  const weekActuals = useMemo(() => {
    const map = {}
    activities.forEach(a => {
      if (a.activity_type !== 'Run') return
      const km = parseFloat(a.distance_km || 0)
      map[a.week_number] = (map[a.week_number] ?? 0) + km
    })
    return map
  }, [activities])

  return (
    <div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-5 text-sm text-slate-400 leading-relaxed">
        <strong className="text-orange-400 font-medium">All running is easy pace — genuinely conversational.</strong>{' '}
        Start around 6:30–7:00/km and let it improve naturally. Every 4th week is a deload — non-negotiable.
        Optional 4th run day can be introduced from Week 9 if 3-day weeks feel comfortable.
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden mb-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['Wk', 'Dates', 'Run 1', 'Run 2', 'Long Run', 'Target', 'Actual', 'Gym', 'Cycling'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-mono text-slate-600 font-normal whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phase1Weeks.map(w => {
              const isCurrent = w.week === currentWeek
              const isPast = w.week < currentWeek
              const actual = weekActuals[w.week]
              const targetKm = parseFloat(w.total)
              const actualKm = actual != null ? parseFloat(actual.toFixed(1)) : null
              const actualColor = actualKm == null
                ? 'text-slate-700'
                : actualKm >= targetKm
                  ? 'text-emerald-400'
                  : isCurrent
                    ? 'text-orange-400'
                    : 'text-red-400'

              return (
                <tr
                  key={w.week}
                  className={`border-b border-slate-800/60 last:border-0 ${
                    isCurrent ? 'bg-orange-950/20' : w.deload ? 'bg-emerald-950/10' : ''
                  } ${isPast ? 'opacity-40' : ''}`}
                  style={{ borderLeft: `3px solid ${isCurrent ? '#f97316' : w.deload ? '#22c55e' : 'transparent'}` }}
                >
                  <td className={`px-3 py-2.5 font-mono text-xs ${isCurrent ? 'text-orange-400' : w.deload ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {w.week}{w.deload ? ' ↓' : ''}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{getWeekDates(w.week)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{w.run1}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{w.run2}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-300">{w.longRun}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-orange-400 font-medium">{w.total}</td>
                  <td className={`px-3 py-2.5 font-mono text-xs font-medium ${actualColor}`}>
                    {actualKm != null && actualKm > 0 ? `${actualKm}km` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{w.gym}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">{w.cycling}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-mono mb-6">
        <span className="text-orange-400">● Current week</span>
        <span className="text-emerald-400">↓ Deload week</span>
        <span className="text-emerald-400">Actual in green = on/over target</span>
        <span className="opacity-40">Dimmed = complete</span>
      </div>

      <SectionLabel>Phase 1 Exit Targets</SectionLabel>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          ['Long run',           '15–17km comfortably'],
          ['Weekly mileage',     '25–30km'],
          ['Easy pace',          'Drifting to 6:00–6:30/km naturally'],
          ['Cycling',            '50km+ rides with solid fuelling'],
          ['Body feel',          'Robust, not managed'],
          ['Garmin prediction',  'Should show clear improvement'],
        ].map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-mono text-slate-500">{k}: </span>
            <span className="text-xs text-slate-400">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
