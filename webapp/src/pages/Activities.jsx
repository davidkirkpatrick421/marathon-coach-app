import { useMemo } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { phase1Weeks } from '../lib/data.js'
import ActivityFeed from '../components/ActivityFeed.jsx'
import MileageChart from '../components/MileageChart.jsx'
import CadenceChart from '../components/CadenceChart.jsx'

export default function Activities() {
  const { activities, loading } = useActivities(20)

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
          Activity Log
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Recent Activities</h1>
      </section>

      <ActivityFeed activities={activities} loading={loading} />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MileageChart data={weeklyData} />
        <CadenceChart data={cadenceData} />
      </section>

    </div>
  )
}
