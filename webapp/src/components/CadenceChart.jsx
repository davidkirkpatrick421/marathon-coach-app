import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const TICK  = { fill: '#e0c0b1', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", opacity: 0.6 }
const TOOLTIP_STYLE = {
  background: '#151b2d',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
}

export default function CadenceChart({ data }) {
  if (!data.length) {
    return (
      <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 h-48 flex items-center justify-center">
        <span className="font-label-mono text-label-mono text-on-surface-variant/50">No run data yet</span>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 flex flex-col gap-4">
      <h3 className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
        Cadence Trend
      </h3>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
              labelStyle={{ color: '#e0c0b1' }}
              itemStyle={{ color: '#ffb690' }}
            />
            <ReferenceLine
              y={170}
              stroke="#ffb690"
              strokeDasharray="4 2"
              opacity={0.5}
              label={{ position: 'insideTopRight', value: '170 Target', fill: '#ffb690', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
            />
            <Line
              dataKey="cadence"
              name="Cadence"
              stroke="#ffb690"
              strokeWidth={2}
              dot={{ fill: '#0c1324', stroke: '#ffb690', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#ffb690' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="pt-2 border-t border-white/5 font-label-mono text-label-mono text-on-surface-variant">
        Target: <span className="text-primary">170 spm</span> · Last {data.length} runs
      </div>
    </div>
  )
}
