import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TICK = { fill: '#475569', fontSize: 11, fontFamily: 'ui-monospace, monospace' }
const TOOLTIP_STYLE = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'ui-monospace, monospace',
}

export default function MileageChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-48 flex items-center justify-center">
        <span className="text-xs font-mono text-slate-600">No data yet</span>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="week" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} unit="km" width={36} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#cbd5e1' }}
            />
            <Bar dataKey="planned" name="Planned" fill="#1e293b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="actual"  name="Actual"  fill="#f97316" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-700" />Planned
        </span>
        <span className="flex items-center gap-1.5 text-xs font-mono text-orange-400">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-orange-500" />Actual
        </span>
      </div>
    </div>
  )
}
