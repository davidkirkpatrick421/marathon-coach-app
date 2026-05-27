import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const TICK = { fill: '#475569', fontSize: 11, fontFamily: 'ui-monospace, monospace' }
const TOOLTIP_STYLE = {
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'ui-monospace, monospace',
}

export default function CadenceChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-48 flex items-center justify-center">
        <span className="text-xs font-mono text-slate-600">No run data yet</span>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
            <YAxis
              domain={[dataMin => Math.max(dataMin - 8, 130), 175]}
              tick={TICK}
              axisLine={false}
              tickLine={false}
              unit="spm"
              width={42}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#fb923c' }}
            />
            <ReferenceLine
              y={170}
              stroke="#f97316"
              strokeDasharray="4 2"
              label={{ position: 'right', value: '170', fill: '#f97316', fontSize: 10 }}
            />
            <Line
              dataKey="cadence"
              name="Cadence"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ fill: '#fb923c', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs font-mono text-slate-500">
        Target: <span className="text-orange-400">170 spm</span> · last {data.length} runs
      </div>
    </div>
  )
}
