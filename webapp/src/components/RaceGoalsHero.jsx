import { goals } from '../lib/data.js'

const GOAL_STYLE = {
  'North Star': {
    labelColor: 'text-primary',
    timeColor:  'text-primary',
    borderTop:  'border-t-2 border-primary',
    topBar:     'bg-primary',
  },
  'A Goal': {
    labelColor: 'text-phase-aerobic',
    timeColor:  'text-phase-aerobic',
    borderTop:  'border-t-2 border-phase-aerobic',
    topBar:     'bg-phase-aerobic',
  },
  'B Goal': {
    labelColor: 'text-success-green',
    timeColor:  'text-success-green',
    borderTop:  'border-t-2 border-success-green',
    topBar:     'bg-success-green',
  },
}

export default function RaceGoalsHero() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {goals.map(g => {
        const s = GOAL_STYLE[g.label] ?? GOAL_STYLE['B Goal']
        return (
          <div
            key={g.label}
            className={`bg-surface-container-high rounded-xl p-5 flex flex-col gap-3 ${s.borderTop}`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-label-mono text-label-mono tracking-widest uppercase ${s.labelColor}`}>
                {g.label}
              </span>
              <span className={`font-label-mono text-label-mono ${s.labelColor}`}>{g.pace}</span>
            </div>
            <div className={`font-display-lg-mobile text-display-lg-mobile ${s.timeColor}`}>
              {g.time}
            </div>
            <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {g.note}
            </div>
          </div>
        )
      })}
    </div>
  )
}
