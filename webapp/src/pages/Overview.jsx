import { useMemo } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { usePlanWeeks } from '../hooks/usePlanWeeks.js'
import { goals, baseline, phases, phase1Weeks, getWeekDates } from '../lib/data.js'
import SectionLabel from '../components/SectionLabel.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import WeekSummaryCard from '../components/WeekSummaryCard.jsx'
import MileageChart from '../components/MileageChart.jsx'
import CadenceChart from '../components/CadenceChart.jsx'
import GarminSyncBadge from '../components/GarminSyncBadge.jsx'
import ReadinessPanel from '../components/ReadinessPanel.jsx'

export default function Overview({ currentWeek }) {
  const { activities, loading } = useActivities()
  const { weeks: dbPlanWeeks, loading: planLoading } = usePlanWeeks()
  const planWeek = dbPlanWeeks?.find(w => w.week === currentWeek) ?? phase1Weeks[currentWeek - 1]

  const weekStats = useMemo(() => {
    const weekActs = activities.filter(a => a.week_number === currentWeek)
    const runs = weekActs.filter(a => a.activity_type === 'Run')
    const totalKm = runs.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0)
    const runsWithHr = runs.filter(a => a.avg_hr)
    const avgHr = runsWithHr.length
      ? Math.round(runsWithHr.reduce((s, a) => s + a.avg_hr, 0) / runsWithHr.length)
      : null
    const runsWithCad = runs.filter(a => a.avg_cadence)
    const avgCadence = runsWithCad.length
      ? Math.round(runsWithCad.reduce((s, a) => s + a.avg_cadence, 0) / runsWithCad.length)
      : null
    return { runs: runs.length, totalKm, avgHr, avgCadence }
  }, [activities, currentWeek])

  const weeklyData = useMemo(() =>
    phase1Weeks.slice(0, currentWeek).map(w => {
      const actual = activities
        .filter(a => a.week_number === w.week && a.activity_type === 'Run')
        .reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0)
      return { week: `W${w.week}`, planned: parseFloat(w.total), actual: parseFloat(actual.toFixed(1)) }
    }),
    [activities, currentWeek]
  )

  const cadenceData = useMemo(() =>
    activities
      .filter(a => a.activity_type === 'Run' && a.avg_cadence)
      .slice(0, 10)
      .reverse()
      .map(a => ({
        date: new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        cadence: a.avg_cadence,
      })),
    [activities]
  )

  return (
    <div className="space-y-7">

      {/* Race Goals */}
      <section>
        <SectionLabel>Race Goals</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goals.map(g => (
            <div
              key={g.label}
              className="bg-slate-900 border border-slate-800 rounded-lg p-4"
              style={{ borderTop: `3px solid ${g.color}` }}
            >
              <div className="text-xl mb-2">{g.emoji}</div>
              <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1">{g.label}</div>
              <div className="text-2xl font-mono font-semibold mb-0.5" style={{ color: g.color }}>{g.time}</div>
              <div className="text-xs font-mono text-slate-600 mb-2">{g.pace}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{g.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Week Summary + Baseline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section>
          <SectionLabel>This Week — Week {currentWeek} · {getWeekDates(currentWeek)}</SectionLabel>
          <WeekSummaryCard planWeek={planWeek} weekStats={weekStats} loading={loading || planLoading} />
        </section>
        <section>
          <SectionLabel>Baseline — May 2026</SectionLabel>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {baseline.map(b => (
              <div key={b.label}>
                <div className="text-xs font-mono text-slate-600 mb-0.5">{b.label}</div>
                <div className="text-sm font-mono text-slate-200">{b.value}</div>
                <div className="text-xs font-mono text-slate-600">{b.sub}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Daily readiness */}
      <section>
        <SectionLabel>Today's Readiness</SectionLabel>
        <ReadinessPanel />
      </section>

      {/* Garmin sync status */}
      <GarminSyncBadge />

      {/* Phase Progress */}
      <section>
        <SectionLabel>Phase 1 Progress</SectionLabel>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Foundation — May–Aug 2026</span>
            <span className="text-orange-400 font-mono font-medium">Week {currentWeek} / 16</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-1.5 bg-orange-500 rounded-full transition-all"
              style={{ width: `${(currentWeek / 16) * 100}%` }}
            />
          </div>
          <div className="text-xs font-mono text-slate-600 mt-2">
            {planWeek?.total} target · {16 - currentWeek} weeks remaining
          </div>
        </div>
      </section>

      {/* Year at a Glance */}
      <section>
        <SectionLabel>Year at a Glance</SectionLabel>
        <div className="space-y-2">
          {phases.map(p => (
            <div
              key={p.id}
              className={`bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center gap-4 transition-opacity ${!p.active ? 'opacity-50' : ''}`}
              style={{ borderLeft: `3px solid ${p.color}` }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-mono font-semibold shrink-0" style={{ color: p.color }}>
                  Phase {p.id}
                </span>
                {p.active && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded shrink-0 text-black" style={{ background: p.color }}>
                    ACTIVE
                  </span>
                )}
                <span className="text-sm text-slate-300 shrink-0">{p.name}</span>
                <span className="text-xs text-slate-500 truncate hidden sm:block">— {p.goal}</span>
              </div>
              <div className="ml-auto text-right shrink-0">
                <div className="text-xs font-mono text-slate-500">{p.dates}</div>
                <div className="text-xs font-mono text-slate-700">Wks {p.weeks}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activities */}
      <section>
        <SectionLabel>Recent Activities</SectionLabel>
        <ActivityFeed activities={activities.slice(0, 8)} loading={loading} />
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section>
          <SectionLabel>Weekly Mileage</SectionLabel>
          <MileageChart data={weeklyData} />
        </section>
        <section>
          <SectionLabel>Cadence Trend</SectionLabel>
          <CadenceChart data={cadenceData} />
        </section>
      </div>

    </div>
  )
}
