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
  const [menuOpen, setMenuOpen] = useState(false)
  const currentWeek = getCurrentWeek()

  function selectTab(id) {
    setTab(id)
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 relative">
        <div className="max-w-4xl mx-auto px-4 pt-5 pb-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-mono tracking-widest text-orange-500 uppercase">Belfast Marathon</span>
            <span className="text-xs font-mono text-slate-600">// May 2027</span>
          </div>
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl font-semibold text-slate-100">David's Training Plan</h1>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4">
                {goals.map(g => (
                  <span key={g.label} className="text-sm font-mono" style={{ color: g.color }}>
                    {g.emoji} {g.time}
                  </span>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-600">Wk {currentWeek} · Ph1</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex -mb-px">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
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

          {/* Mobile nav bar */}
          <div className="sm:hidden flex items-center justify-between py-2.5">
            <span className="text-xs font-mono tracking-wide text-orange-400">
              {TABS.find(t => t.id === tab)?.label.toUpperCase()}
            </span>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Open navigation"
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="3" x2="15" y2="15" />
                  <line x1="15" y1="3" x2="3" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="2" y1="5" x2="16" y2="5" />
                  <line x1="2" y1="9" x2="16" y2="9" />
                  <line x1="2" y1="13" x2="16" y2="13" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
            <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 z-30 shadow-2xl sm:hidden">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-xs font-mono tracking-wide border-b border-slate-800/60 last:border-0 transition-colors ${
                    tab === t.id
                      ? 'text-orange-400 bg-orange-950/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {t.label.toUpperCase()}
                  {tab === t.id && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>
              ))}
            </div>
          </>
        )}
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
