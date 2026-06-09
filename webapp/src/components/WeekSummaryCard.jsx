export default function WeekSummaryCard({ planWeek, weekStats, loading }) {
  if (loading) {
    return <div className="bg-surface-container-low rounded-xl border border-white/5 h-40 animate-pulse" />
  }

  const targetKm = planWeek ? parseFloat(planWeek.total) : null
  const compliance = targetKm ? Math.round((weekStats.totalKm / targetKm) * 100) : null

  const complianceColor = compliance == null ? ''
    : compliance >= 80 ? 'text-success-green'
    : compliance >= 50 ? 'text-primary'
    : 'text-error'

  const complianceBg = compliance == null ? ''
    : compliance >= 80 ? 'bg-success-green'
    : compliance >= 50 ? 'bg-primary'
    : 'bg-error'

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 flex flex-col gap-6 h-full">
      <div className="grid grid-cols-2 gap-6">
        <Stat label="Target" value={planWeek?.total ?? '—'} />
        <Stat label="Actual" value={`${weekStats.totalKm.toFixed(1)}km`} accent />
        <Stat label="Runs"   value={`${weekStats.runs} / ${planWeek?.targetRunCount ?? 3}`} />
        <Stat label="Avg HR" value={weekStats.avgHr ? `${weekStats.avgHr} bpm` : '—'} />
      </div>

      {compliance !== null && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between font-label-mono text-label-mono">
            <span className="text-on-surface-variant">Compliance</span>
            <span className={complianceColor}>{compliance}%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${complianceBg}`}
              style={{ width: `${Math.min(compliance, 100)}%` }}
            />
          </div>
        </div>
      )}

      {weekStats.avgCadence != null && (
        <div className="font-label-mono text-label-mono text-on-surface-variant pt-2 border-t border-white/5">
          Avg cadence: <span className="text-on-surface">{weekStats.avgCadence} spm</span>
          {weekStats.avgCadence < 170 && (
            <span className="text-primary ml-1">({170 - weekStats.avgCadence} below 170 target)</span>
          )}
        </div>
      )}

      {planWeek?.deload && (
        <div className="font-label-mono text-label-mono text-tertiary">↓ Deload week</div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className="font-label-mono text-label-mono text-on-surface-variant mb-1">{label}</div>
      <div className={`font-headline-md text-headline-md ${accent ? 'text-primary' : 'text-on-background'}`}>
        {value}
      </div>
    </div>
  )
}
