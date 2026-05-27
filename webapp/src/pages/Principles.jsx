import { keyPrinciples } from '../lib/data.js'
import SectionLabel from '../components/SectionLabel.jsx'

export default function Principles() {
  return (
    <div className="space-y-7">

      <div className="space-y-2.5">
        {keyPrinciples.map(p => (
          <div key={p.title} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex gap-4">
            <span className="text-2xl shrink-0">{p.icon}</span>
            <div>
              <div className="text-sm font-medium text-slate-100 mb-1">{p.title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <SectionLabel>Form Cues — Every Run</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Short, quick steps',        'Foot lands under hips, not ahead. Overstriding = braking.'],
            ['Relaxed shoulders',         'Drop them consciously every few minutes. Chef tension is real.'],
            ['Forward lean from ankles',  'Not from the waist. Slight lean, not a hunch.'],
            ['Form breaking down?',       'Walk 60–90 seconds, reset, continue. Walking isn\'t failure.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-xs font-mono text-orange-400 mb-1">{title}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Evening Stretch Routine — 15 min</SectionLabel>
        <div
          className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden"
          style={{ borderLeft: '3px solid #22c55e' }}
        >
          {[
            'Hip Flexors — kneeling lunge, 45–60 sec each',
            'Glute/Piriformis — figure-4 supine, 45–60 sec each',
            'Hamstrings — supine straight leg, 45–60 sec each',
            'Calf + Achilles — wall stretch, both straight and bent knee',
            'Quad stretch — standing or side-lying',
            'Thoracic rotation — seated, 10 slow reps each side',
            '90/90 hip stretch — both internal and external rotation',
          ].map(s => (
            <div key={s} className="px-4 py-2.5 border-b border-slate-800/60 last:border-0 text-xs text-slate-400">
              {s}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
