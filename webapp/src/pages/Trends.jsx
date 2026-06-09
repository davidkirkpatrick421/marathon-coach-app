import { useMemo } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { phase1Weeks } from '../lib/data.js'
import MileageChart from '../components/MileageChart.jsx'
import CadenceChart from '../components/CadenceChart.jsx'

export default function Trends() {
  const { activities } = useActivities()

  const weeklyData = useMemo(() => {
    const runTypes = ['Run', 'TrailRun', 'VirtualRun']
    return phase1Weeks.map(w => {
      const actual = activities
        .filter(a => a.week_number === w.week && runTypes.includes(a.activity_type))
        .reduce((sum, a) => sum + parseFloat(a.distance_km || 0), 0)
      return { week: `W${w.week}`, planned: parseFloat(w.total), actual: parseFloat(actual.toFixed(1)) }
    }).filter(d => d.actual > 0 || d.planned > 0)
  }, [activities])

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
    <div className="flex flex-col gap-10">

      <section className="flex flex-col gap-2">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Analytics
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Trends</h1>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MileageChart data={weeklyData} />
        <CadenceChart data={cadenceData} />
      </section>

      <section className="bg-surface-container-low rounded-xl border border-white/5 p-8 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 text-[48px]">insights</span>
        <div className="font-headline-md text-headline-md text-on-surface">Advanced analysis coming soon</div>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
          Aerobic efficiency, training load (ATL/CTL), HR zone distribution, and sleep–performance correlations
          will appear here as more data accumulates.
        </p>
      </section>

    </div>
  )
}
