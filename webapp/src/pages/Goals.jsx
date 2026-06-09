const GOALS = [
  {
    tier:      'North Star',
    time:      'Sub-3 Hour\nMarathon',
    pace:      '4:15/km',
    condition: 'Everything clicks, mileage exceeds expectations',
    probability: null,
    tierColor: 'text-primary',
    borderColor: 'border-primary/20',
    glowColor: 'bg-primary/20',
    timeColor: 'text-on-surface',
  },
  {
    tier:      'A Goal',
    time:      '3:15–3:30',
    pace:      '4:37–4:58/km',
    condition: 'Solid year, consistent training, no major injury',
    probability: null,
    tierColor:   'text-secondary',
    borderColor: 'border-secondary/20',
    glowColor:   'bg-secondary/10',
    timeColor:   'text-secondary',
  },
  {
    tier:      'B Goal',
    time:      '3:45–4:00',
    pace:      '5:19–5:41/km',
    condition: 'Realistic given 3 days/week — still a massive PB',
    probability: null,
    tierColor:   'text-phase-foundation',
    borderColor: 'border-phase-foundation/20',
    glowColor:   'bg-phase-foundation/10',
    timeColor:   'text-phase-foundation',
  },
]

function NorthStarCard({ goal }) {
  return (
    <section className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface-container-high to-surface-container border ${goal.borderColor}`}>
      <div className={`absolute -top-24 -right-24 w-64 h-64 ${goal.glowColor} rounded-full blur-[80px] pointer-events-none`} />
      <div className="relative p-6 md:p-8 flex flex-col gap-8">
        <div className="flex justify-between items-start">
          <span className={`inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label-mono text-label-mono ${goal.tierColor} uppercase tracking-widest`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
            {goal.tier}
          </span>
          <span className="material-symbols-outlined text-primary/30 text-[32px]">flag</span>
        </div>

        <div>
          {goal.time.split('\n').map((line, i) => (
            <h2 key={i} className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface leading-tight">
              {line}
            </h2>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-1">Target Pace</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md text-on-surface">{goal.pace.split('/')[0]}</span>
              <span className="font-body-md text-body-md text-on-surface-variant">/km</span>
            </div>
          </div>
          <div>
            <span className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-1">Probability</span>
            <span className="font-headline-md text-headline-md text-on-surface-variant/40">—</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">calendar_today</span>
          <span className="font-body-md text-body-md text-on-surface-variant">Belfast Marathon · 5 May 2027</span>
        </div>
      </div>
    </section>
  )
}

function SupportingGoalCard({ goal }) {
  return (
    <div
      className={`bg-surface-container-low rounded-xl border ${goal.borderColor} p-5 flex flex-col gap-4 hover:bg-surface-container-high/50 transition-colors`}
      style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex justify-between items-center">
        <span className={`font-label-mono text-label-mono uppercase tracking-widest ${goal.tierColor}`}>{goal.tier}</span>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">trending_up</span>
      </div>
      <div>
        <div className={`font-headline-md text-headline-md ${goal.timeColor}`}>{goal.time}</div>
        <div className="font-body-md text-body-md text-on-surface-variant mt-1">{goal.pace}</div>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">{goal.condition}</p>
      <div className="w-full bg-white/5 h-1 rounded-full" />
    </div>
  )
}

export default function Goals() {
  const [northStar, ...supporting] = GOALS

  return (
    <div className="flex flex-col gap-10 max-w-2xl mx-auto md:max-w-none">

      {/* Header */}
      <section className="flex flex-col gap-2">
        <div className="font-label-mono text-label-mono text-primary tracking-widest uppercase">
          Belfast Marathon <span className="text-on-surface-variant/50">//</span> May 2027
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Race Goals</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Your active targets for the current cycle.</p>
      </section>

      <NorthStarCard goal={northStar} />

      <section className="flex flex-col gap-4">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest pl-3 border-l-2 border-surface-container-high">
          Supporting Objectives
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supporting.map(g => (
            <SupportingGoalCard key={g.tier} goal={g} />
          ))}
        </div>
      </section>

    </div>
  )
}
