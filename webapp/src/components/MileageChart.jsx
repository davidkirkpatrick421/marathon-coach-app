import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TICK  = { fill: '#e0c0b1', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }
const TOOLTIP_STYLE = {
  background: '#151b2d',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
}

export default function MileageChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 h-48 flex items-center justify-center">
        <span className="font-label-mono text-label-mono text-on-surface-variant/50">No data yet</span>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 flex flex-col gap-4">
      <h3 className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
        Weekly Mileage
      </h3>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="week" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} unit="km" width={36} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: '#e0c0b1' }}
              itemStyle={{ color: '#dce1fb' }}
            />
            <Bar dataKey="planned" name="Planned" fill="#2e3447" radius={[2, 2, 0, 0]} />
            <Bar dataKey="actual"  name="Actual"  fill="#ffb690" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
        <span className="flex items-center gap-1.5 font-label-mono text-[10px] text-on-surface-variant">
          <span className="w-3 h-3 rounded-sm inline-block bg-surface-container-highest" />Planned
        </span>
        <span className="flex items-center gap-1.5 font-label-mono text-[10px] text-primary">
          <span className="w-3 h-3 rounded-sm inline-block bg-primary" />Actual
        </span>
      </div>
    </div>
  )
}
