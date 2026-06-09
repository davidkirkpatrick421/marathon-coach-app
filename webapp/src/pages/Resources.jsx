import { useState } from 'react'
import { strengthA, strengthB, nutritionPrinciples, keyPrinciples } from '../lib/data.js'

const SUB_TABS = [
  { id: 'strength',   label: 'Strength'   },
  { id: 'nutrition',  label: 'Nutrition'  },
  { id: 'principles', label: 'Principles' },
]

function SectionHeading({ children }) {
  return (
    <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest mb-4 pb-3 border-b border-white/5">
      {children}
    </div>
  )
}

function ExerciseCard({ exercise, sets, note }) {
  return (
    <div className="bg-surface-container-high rounded-lg px-4 py-3 flex justify-between items-start gap-4">
      <div>
        <div className="font-body-md text-body-md text-on-surface">{exercise}</div>
        <div className="font-label-mono text-label-mono text-on-surface-variant mt-0.5">{note}</div>
      </div>
      <span className="font-label-mono text-label-mono text-primary shrink-0">{sets}</span>
    </div>
  )
}

function StrengthSection() {
  return (
    <section id="strength" className="flex flex-col gap-6">
      <SectionHeading>Strength Training</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <div className="font-body-md text-body-md font-semibold text-on-surface">Strength A — Weeks 1–8</div>
          <p className="font-label-mono text-label-mono text-on-surface-variant">
            Foundation phase. Focus on glute/hip/knee tracking. Low load, high control.
          </p>
          <div className="flex flex-col gap-2">
            {strengthA.map(e => <ExerciseCard key={e.exercise} {...e} />)}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="font-body-md text-body-md font-semibold text-on-surface">Strength B — Weeks 9–16</div>
          <p className="font-label-mono text-label-mono text-on-surface-variant">
            Load added, more running-specific. Carry-over into running by September.
          </p>
          <div className="flex flex-col gap-2">
            {strengthB.map(e => <ExerciseCard key={e.exercise} {...e} />)}
          </div>
        </div>
      </div>
      <div className="bg-surface-container-low rounded-xl border-l-2 border-primary p-5">
        <div className="font-body-md text-body-md text-primary mb-2">Why this matters for your knee</div>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Most likely cause of your previous knee issue: weak glutes and hips causing poor knee tracking
          under load. These exercises directly address that pattern. You'll notice the form breakdown at
          end of runs stops happening around weeks 5–6.
        </p>
      </div>
    </section>
  )
}

function NutritionSection() {
  return (
    <section id="nutrition" className="flex flex-col gap-6">
      <SectionHeading>Nutrition</SectionHeading>
      <div className="bg-surface-container-low rounded-xl border-l-2 border-primary p-5">
        <div className="font-body-md text-body-md text-primary mb-2">Phase 1 Nutrition Strategy</div>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          Phase 1 is the best window in the year for fat loss. Small deficit now.
          Once Phase 3 starts, drop the deficit entirely and eat to fuel performance.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {nutritionPrinciples.map(n => (
          <div key={n.title} className="bg-surface-container-low rounded-xl border border-white/5 p-5">
            <div className="font-body-md text-body-md font-semibold text-on-surface mb-1">{n.title}</div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{n.body}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'Run / Gym Day',
            colorClass: 'border-t-2 border-primary',
            labelClass: 'text-primary',
            items: [
              'Breakfast: Eggs, wholegrain toast, fruit',
              'Lunch: Lean protein + veg + moderate carbs',
              'Post-training (30 min): Greek yoghurt, eggs or shake',
              'Dinner: Protein-led, veg, smaller carb portion',
            ],
          },
          {
            label: 'Rest Day',
            colorClass: 'border-t-2 border-on-surface-variant/30',
            labelClass: 'text-on-surface-variant',
            items: [
              'Same structure as training day',
              'Reduce carb portions at lunch and dinner',
              'Keep protein high',
              'No pre-workout carb loading needed',
            ],
          },
        ].map(d => (
          <div key={d.label} className={`bg-surface-container-low rounded-xl overflow-hidden ${d.colorClass}`}>
            <div className={`px-5 pt-4 pb-2 font-label-mono text-label-mono uppercase tracking-widest ${d.labelClass}`}>
              {d.label}
            </div>
            {d.items.map(item => (
              <div key={item} className="px-5 py-3 border-t border-white/5 font-body-md text-body-md text-on-surface-variant">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function PrinciplesSection() {
  return (
    <section id="principles" className="flex flex-col gap-6">
      <SectionHeading>Training Principles</SectionHeading>
      <div className="flex flex-col gap-3">
        {keyPrinciples.map(p => (
          <div key={p.title} className="bg-surface-container-low rounded-xl border border-white/5 p-5 flex gap-4">
            <span className="text-2xl shrink-0">{p.icon}</span>
            <div>
              <div className="font-body-md text-body-md font-semibold text-on-surface mb-1">{p.title}</div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{p.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Form Cues — Every Run
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['Short, quick steps',       'Foot lands under hips, not ahead. Overstriding = braking.'],
            ['Relaxed shoulders',        'Drop them consciously every few minutes. Chef tension is real.'],
            ['Forward lean from ankles', 'Not from the waist. Slight lean, not a hunch.'],
            ['Form breaking down?',      "Walk 60–90 seconds, reset, continue. Walking isn't failure."],
          ].map(([title, body]) => (
            <div key={title} className="bg-surface-container-low rounded-xl border border-white/5 p-4">
              <div className="font-label-mono text-label-mono text-primary mb-2">{title}</div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Evening Stretch Routine — 15 min
        </div>
        <div className="bg-surface-container-low rounded-xl border-l-2 border-success-green overflow-hidden">
          {[
            'Hip Flexors — kneeling lunge, 45–60 sec each',
            'Glute/Piriformis — figure-4 supine, 45–60 sec each',
            'Hamstrings — supine straight leg, 45–60 sec each',
            'Calf + Achilles — wall stretch, both straight and bent knee',
            'Quad stretch — standing or side-lying',
            'Thoracic rotation — seated, 10 slow reps each side',
            '90/90 hip stretch — both internal and external rotation',
          ].map(s => (
            <div key={s} className="px-5 py-3 border-b border-white/5 last:border-0 font-body-md text-body-md text-on-surface-variant">
              {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Resources() {
  const [activeTab, setActiveTab] = useState('strength')

  return (
    <div className="flex flex-col gap-8">

      <section className="flex flex-col gap-2">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Resources</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Training protocols, nutrition strategy, and principles for Belfast Marathon 2027.
        </p>
      </section>

      {/* Sub-tab strip */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 border border-white/5 self-start">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`font-label-mono text-label-mono px-4 py-2 rounded-lg tracking-widest uppercase transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-surface-container-highest text-on-surface'
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'strength'   && <StrengthSection />}
      {activeTab === 'nutrition'  && <NutritionSection />}
      {activeTab === 'principles' && <PrinciplesSection />}

    </div>
  )
}
