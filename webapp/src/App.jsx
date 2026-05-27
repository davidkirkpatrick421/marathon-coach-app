import { useState } from 'react'
import { goals, getCurrentWeek } from './lib/data.js'
import Overview from './pages/Overview.jsx'
import Phase1 from './pages/Phase1.jsx'
import Strength from './pages/Strength.jsx'
import Nutrition from './pages/Nutrition.jsx'
import Principles from './pages/Principles.jsx'

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'phase1',     label: 'Phase 1' },
  { id: 'strength',   label: 'Strength' },
  { id: 'nutrition',  label: 'Nutrition' },
  { id: 'principles', label: 'Principles' },
]

export default function App() {
  const [tab, setTab] = useState('overview')
  const currentWeek = getCurrentWeek()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-mono tracking-widest text-orange-500 uppercase">Belfast Marathon</span>
            <span className="text-xs font-mono text-slate-600">// May 2027</span>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-100">David's Training Plan</h1>
            <div className="flex items-center gap-4">
              {goals.map(g => (
                <span key={g.label} className="text-sm font-mono" style={{ color: g.color }}>
                  {g.emoji} {g.time}
                </span>
              ))}
              <span className="text-xs font-mono text-slate-600">Wk {currentWeek} · Ph1</span>
            </div>
          </div>
          <nav className="flex -mb-px">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-mono tracking-wide border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'overview'   && <Overview currentWeek={currentWeek} />}
        {tab === 'phase1'     && <Phase1 currentWeek={currentWeek} />}
        {tab === 'strength'   && <Strength />}
        {tab === 'nutrition'  && <Nutrition />}
        {tab === 'principles' && <Principles />}
      </main>

      <footer className="border-t border-slate-800/50 py-4 text-center mt-8">
        <span className="text-xs font-mono text-slate-700">Log on Strava · Belfast Marathon, May 2027</span>
      </footer>
    </div>
  )
}
