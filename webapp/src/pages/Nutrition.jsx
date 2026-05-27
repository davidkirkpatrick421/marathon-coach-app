import { nutritionPrinciples } from '../lib/data.js'
import SectionLabel from '../components/SectionLabel.jsx'

export default function Nutrition() {
  return (
    <div>
      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-5"
        style={{ borderLeft: '3px solid #f59e0b' }}
      >
        <div className="text-sm font-mono text-amber-400 mb-1">Phase 1 Nutrition Strategy</div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Phase 1 is the best window in the year for fat loss. Small deficit now.
          Once Phase 3 starts, drop the deficit entirely and eat to fuel performance.
        </p>
      </div>

      <div className="space-y-2.5 mb-6">
        {nutritionPrinciples.map(n => (
          <div key={n.title} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-sm font-mono text-slate-200 mb-1">{n.title}</div>
            <p className="text-xs text-slate-400 leading-relaxed">{n.body}</p>
          </div>
        ))}
      </div>

      <SectionLabel>Sample Day Structure</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'Run / Gym Day',
            color: '#f97316',
            items: [
              'Breakfast: Eggs, wholegrain toast, fruit',
              'Lunch: Lean protein + veg + moderate carbs',
              'Post-training (30 min): Greek yoghurt, eggs or shake',
              'Dinner: Protein-led, veg, smaller carb portion',
            ],
          },
          {
            label: 'Rest Day',
            color: '#475569',
            items: [
              'Same structure as training day',
              'Reduce carb portions at lunch and dinner',
              'Keep protein high',
              'No pre-workout carb loading needed',
            ],
          },
        ].map(d => (
          <div
            key={d.label}
            className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
            style={{ borderTop: `3px solid ${d.color}` }}
          >
            <div className="px-4 pt-3 pb-1 text-xs font-mono tracking-wide" style={{ color: d.color }}>
              {d.label.toUpperCase()}
            </div>
            {d.items.map(item => (
              <div key={item} className="px-4 py-2 border-t border-slate-800/60 text-xs text-slate-400 leading-relaxed">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
