import { useState } from 'react'
import ScrollToTop from './components/ScrollToTop.jsx'
import { getCurrentWeek } from './lib/data.js'
import Overview from './pages/Overview.jsx'
import Goals from './pages/Goals.jsx'
import Phases from './pages/Phases.jsx'
import Activities from './pages/Activities.jsx'
import Trends from './pages/Trends.jsx'
import Resources from './pages/Resources.jsx'

const TABS = [
  { id: 'overview',   label: 'Overview'    },
  { id: 'goals',      label: 'Goals'       },
  { id: 'phases',     label: 'Phases'      },
  { id: 'activities', label: 'Activities'  },
  { id: 'trends',     label: 'Trends'      },
  { id: 'resources',  label: 'Resources'   },
]

export default function App() {
  const [tab, setTab]         = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const currentWeek           = getCurrentWeek()
  const activeLabel           = TABS.find(t => t.id === tab)?.label ?? ''

  function selectTab(id) {
    setTab(id)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5">

        {/* Desktop nav — horizontal tabs */}
        <nav className="hidden md:flex overflow-x-auto hide-scrollbar px-margin-desktop gap-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={`font-label-mono text-label-mono whitespace-nowrap py-4 border-b-2 transition-colors ${
                tab === t.id
                  ? 'text-primary font-bold border-primary'
                  : 'text-on-surface-variant/60 border-transparent hover:text-on-surface'
              }`}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>

        {/* Mobile nav — active page label + hamburger */}
        <div className="flex md:hidden items-center justify-between px-margin-mobile py-4">
          <span className="font-label-mono text-label-mono text-primary font-bold tracking-widest uppercase">
            {activeLabel}
          </span>
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 -mr-1"
          >
            <span className="material-symbols-outlined text-[22px]">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile dropdown — rendered outside header so it can overlap content */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-[53px] left-0 right-0 z-50 md:hidden bg-surface-container-low border-b border-white/5 shadow-2xl">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
                className={`w-full flex items-center justify-between px-margin-mobile py-4 border-b border-white/5 last:border-0 font-label-mono text-label-mono tracking-widest uppercase transition-colors ${
                  tab === t.id
                    ? 'text-primary bg-primary/5'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {t.label}
                {tab === t.id && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-12">
        {tab === 'overview'   && <Overview currentWeek={currentWeek} onNavigate={selectTab} />}
        {tab === 'goals'      && <Goals />}
        {tab === 'phases'     && <Phases currentWeek={currentWeek} />}
        {tab === 'activities' && <Activities />}
        {tab === 'trends'     && <Trends />}
        {tab === 'resources'  && <Resources />}
      </main>

      <footer className="border-t border-white/5 py-6 mt-8">
        <p className="text-center font-label-mono text-label-mono text-on-surface-variant/40">
          BELFAST MARATHON · MAY 2027
        </p>
      </footer>
      <ScrollToTop />
    </div>
  )
}
