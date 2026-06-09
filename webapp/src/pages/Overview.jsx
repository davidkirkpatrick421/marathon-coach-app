import { useMemo } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { usePlanWeeks } from '../hooks/usePlanWeeks.js'
import { phases, phase1Weeks, getWeekDates } from '../lib/data.js'
import ActivityFeed from '../components/ActivityFeed.jsx'
import WeekSummaryCard from '../components/WeekSummaryCard.jsx'
import MileageChart from '../components/MileageChart.jsx'
import CadenceChart from '../components/CadenceChart.jsx'
import GarminSyncBadge from '../components/GarminSyncBadge.jsx'
import ReadinessPanel from '../components/ReadinessPanel.jsx'
import RaceGoalsHero from '../components/RaceGoalsHero.jsx'
import WeeklyProgressRing from '../components/WeeklyProgressRing.jsx'

const PHASE_ICON = {
  Foundation:           'terrain',
  'Aerobic Development':'water_drop',
  'Marathon Build':     'local_fire_department',
  Taper:                'flight_takeoff',
}
const PHASE_COLOR_CLASS = {
  Foundation:           'text-phase-foundation border-phase-foundation/30',
  'Aerobic Development':'text-phase-aerobic border-phase-aerobic/30',
  'Marathon Build':     'text-phase-build border-phase-build/30',
  Taper:                'text-phase-taper border-phase-taper/30',
}

export default function Overview({ currentWeek }) {
  const { activities, loading }             = useActivities()
  const { weeks: dbPlanWeeks, loading: planLoading } = usePlanWeeks()
  const planWeek = dbPlanWeeks?.find(w => w.week === currentWeek) ?? phase1Weeks[currentWeek - 1]

  const weekStats = useMemo(() => {
    const weekActs = activities.filter(a => a.week_number === currentWeek)
    const runs     = weekActs.filter(a => ['Run', 'TrailRun', 'VirtualRun'].includes(a.activity_type))
    const totalKm  = runs.reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0)
    const runsWithHr  = runs.filter(a => a.avg_hr)
    const avgHr       = runsWithHr.length
      ? Math.round(runsWithHr.reduce((s, a) => s + a.avg_hr, 0) / runsWithHr.length)
      : null
    const runsWithCad = runs.filter(a => a.avg_cadence)
    const avgCadence  = runsWithCad.length
      ? Math.round(runsWithCad.reduce((s, a) => s + a.avg_cadence, 0) / runsWithCad.length)
      : null
    return { runs: runs.length, totalKm, avgHr, avgCadence }
  }, [activities, currentWeek])

  const weeklyData = useMemo(() =>
    phase1Weeks.slice(0, currentWeek).map(w => {
      const actual = activities
        .filter(a => a.week_number === w.week && ['Run', 'TrailRun', 'VirtualRun'].includes(a.activity_type))
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

  const targetKm = planWeek ? parseFloat(planWeek.total) : 0

  return (
    <div className="flex flex-col gap-12">

      {/* Context header */}
      <section className="flex flex-col gap-2">
        <div className="font-label-mono text-label-mono text-primary tracking-widest uppercase">
          Belfast Marathon <span className="text-on-surface-variant/50">//</span> May 2027
        </div>
        <h1 className="font-headline-lg text-headline-lg md:font-display-lg md:text-display-lg text-on-surface">
          David's Training Plan
        </h1>
      </section>

      {/* Desktop: Race Goals 3-col grid (hidden on mobile — in Goals tab) */}
      <section className="hidden sm:block">
        <RaceGoalsHero />
      </section>

      {/* Mobile-only: Weekly Progress Ring */}
      <section className="flex flex-col items-center sm:hidden">
        <WeeklyProgressRing
          actualKm={weekStats.totalKm}
          targetKm={targetKm}
          currentWeek={currentWeek}
        />
      </section>

      {/* Week summary + Readiness — side by side on desktop, same height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="flex flex-col gap-2">
          <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
            This Week — Week {currentWeek} · {getWeekDates(currentWeek)}
          </div>
          <div className="flex-1">
            <WeekSummaryCard planWeek={planWeek} weekStats={weekStats} loading={loading || planLoading} />
          </div>
        </section>
        <section className="flex flex-col gap-2">
          <div className="font-label-mono text-label-mono invisible select-none" aria-hidden="true">&nbsp;</div>
          <div className="flex-1">
            <ReadinessPanel />
          </div>
        </section>
      </div>

      {/* Garmin sync */}
      <GarminSyncBadge />

      {/* Phase 1 Progress */}
      <section className="flex flex-col gap-4">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Phase 1 Progress
        </div>
        <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-body-md text-body-md text-on-surface-variant">Foundation — May–Aug 2026</span>
            <span className="font-label-mono text-label-mono text-primary">Week {currentWeek} / 16</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-phase-foundation rounded-full transition-all"
              style={{ width: `${(currentWeek / 16) * 100}%` }}
            />
          </div>
          <div className="font-label-mono text-label-mono text-on-surface-variant/60">
            {planWeek?.total} target · {16 - currentWeek} weeks remaining
          </div>
        </div>
      </section>

      {/* Year at a Glance */}
      <section className="flex flex-col gap-4">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Year at a Glance
        </div>
        <div className="flex flex-col gap-3">
          {phases.map(p => {
            const colorCls = PHASE_COLOR_CLASS[p.name] ?? 'text-on-surface-variant border-white/10'
            const icon     = PHASE_ICON[p.name] ?? 'timeline'
            return (
              <div
                key={p.id}
                className={`bg-surface-container-low rounded-xl border px-5 py-4 flex items-center gap-4 transition-opacity ${colorCls} ${!p.active ? 'opacity-50' : ''}`}
              >
                <span className={`material-symbols-outlined text-[20px]`}>{icon}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-body-md text-body-md font-semibold text-on-surface shrink-0">{p.name}</span>
                  {p.active && (
                    <span className="font-label-mono text-[10px] px-2 py-0.5 rounded-full bg-success-green/20 text-success-green border border-success-green/30 uppercase tracking-wider shrink-0">
                      Active
                    </span>
                  )}
                  {!p.active && (
                    <span className="font-label-mono text-label-mono text-on-surface-variant/40 uppercase shrink-0">
                      Upcoming
                    </span>
                  )}
                  <span className="font-body-md text-body-md text-on-surface-variant truncate hidden sm:block">
                    {p.goal}
                  </span>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="font-label-mono text-label-mono text-on-surface-variant">{p.dates}</div>
                  <div className="font-label-mono text-label-mono text-on-surface-variant/40">Wks {p.weeks}</div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Charts — 2-col on desktop, stacked on mobile */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MileageChart data={weeklyData} />
        <CadenceChart data={cadenceData} />
      </section>

      {/* Recent Activities — last 3 only; full list is in Activities tab */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
            Latest Activity
          </div>
        </div>
        <ActivityFeed activities={activities.slice(0, 3)} loading={loading} />
      </section>

    </div>
  )
}
