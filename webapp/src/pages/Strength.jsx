import { strengthA, strengthB } from '../lib/data.js'
import SectionLabel from '../components/SectionLabel.jsx'

export default function Strength() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <SectionLabel>Strength A — Weeks 1–8</SectionLabel>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Foundation phase. Focus on glute/hip/knee tracking. Low load, high control.
          </p>
          {strengthA.map(e => <ExerciseCard key={e.exercise} {...e} />)}
        </div>
        <div>
          <SectionLabel>Strength B — Weeks 9–16</SectionLabel>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Load added, more running-specific. Carry-over into running by September.
          </p>
          {strengthB.map(e => <ExerciseCard key={e.exercise} {...e} />)}
        </div>
      </div>

      <div
        className="bg-slate-900 border border-slate-800 rounded-lg p-4"
        style={{ borderLeft: '3px solid #f97316' }}
      >
        <div className="text-sm font-mono text-orange-400 mb-2">Why this matters for your knee</div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Most likely cause of your previous knee issue: weak glutes and hips causing poor knee tracking
          under load. Form breaks down — knee absorbs impact it shouldn't. These exercises directly address
          that pattern. You'll notice the form breakdown at end of runs stops happening around weeks 5–6.
        </p>
      </div>
    </div>
  )
}

function ExerciseCard({ exercise, sets, note }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md px-3 py-2.5 mb-2">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-sm text-slate-200">{exercise}</span>
        <span className="text-xs font-mono text-orange-400 shrink-0 ml-2">{sets}</span>
      </div>
      <div className="text-xs text-slate-500">{note}</div>
    </div>
  )
}
