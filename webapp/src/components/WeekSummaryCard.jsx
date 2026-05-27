export default function WeekSummaryCard({ planWeek, weekStats, loading }) {
  if (loading) {
    return <div className="bg-slate-900 border border-slate-800 rounded-lg h-36 animate-pulse" />
  }

  const targetKm = planWeek ? parseFloat(planWeek.total) : null
  const compliance = targetKm ? Math.round((weekStats.totalKm / targetKm) * 100) : null
  const complianceColor = compliance == null ? ''
    : compliance >= 80 ? 'text-emerald-400'
    : compliance >= 50 ? 'text-orange-400'
    : 'text-red-400'
  const complianceBg = compliance == null ? ''
    : compliance >= 80 ? 'bg-emerald-500'
    : compliance >= 50 ? 'bg-orange-500'
    : 'bg-red-500'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Target" value={planWeek?.total ?? '—'} />
        <Stat label="Actual" value={`${weekStats.totalKm.toFixed(1)}km`} accent />
        <Stat label="Runs" value={`${weekStats.runs} / 3`} />
        <Stat label="Avg HR" value={weekStats.avgHr ? `${weekStats.avgHr} bpm` : '—'} />
      </div>

      {compliance !== null && (
        <div>
          <div className="flex justify-between text-xs font-mono text-slate-500 mb-1.5">
            <span>Compliance</span>
            <span className={complianceColor}>{compliance}%</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-1 rounded-full transition-all ${complianceBg}`}
              style={{ width: `${Math.min(compliance, 100)}%` }}
            />
          </div>
        </div>
      )}

      {weekStats.avgCadence != null && (
        <div className="text-xs font-mono text-slate-500 pt-0.5">
          Avg cadence: <span className="text-slate-300">{weekStats.avgCadence} spm</span>
          {weekStats.avgCadence < 170 && (
            <span className="text-orange-500 ml-1">({170 - weekStats.avgCadence} below 170 target)</span>
          )}
        </div>
      )}

      {planWeek?.deload && (
        <div className="text-xs font-mono text-emerald-500">↓ Deload week</div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="text-xs font-mono text-slate-500 mb-0.5">{label}</div>
      <div className={`text-lg font-mono ${accent ? 'text-orange-400' : 'text-slate-100'}`}>{value}</div>
    </div>
  )
}
