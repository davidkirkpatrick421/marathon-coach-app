import React, { useMemo, useState } from 'react'
import { useActivities } from '../hooks/useActivities.js'
import { usePlanWeeks } from '../hooks/usePlanWeeks.js'
import { phases, phase1Weeks, getWeekDates } from '../lib/data.js'

const PHASE_META = {
  Foundation:           { icon: 'terrain',              color: 'phase-foundation', colorHex: '#94A3B8' },
  'Aerobic Development':{ icon: 'water_drop',            color: 'phase-aerobic',    colorHex: '#38BDF8' },
  'Marathon Build':     { icon: 'local_fire_department', color: 'phase-build',      colorHex: '#F97316' },
  Taper:                { icon: 'flight_takeoff',        color: 'phase-taper',      colorHex: '#A855F7' },
}

function PhaseHeroCard({ currentWeek, onScrollToCurrentWeek }) {
  const pct = Math.round((currentWeek / 16) * 100)
  return (
    <button
      onClick={onScrollToCurrentWeek}
      className="relative bg-surface-container-low rounded-xl border border-phase-foundation/30 p-6 overflow-hidden flex flex-col gap-4 w-full text-left cursor-pointer hover:bg-surface-container-high/60 transition-colors group"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-phase-foundation/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-phase-foundation text-[20px]">terrain</span>
            <span className="font-label-mono text-label-mono text-phase-foundation uppercase tracking-widest">
              Phase 1 of 4
            </span>
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">Foundation</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-success-green/10 border border-success-green/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-success-green animate-pulse" />
            <span className="font-label-mono text-label-mono text-success-green uppercase tracking-wider">Active</span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-on-surface-variant transition-colors text-[20px]">
            arrow_downward
          </span>
        </div>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant relative z-10 max-w-xl">
        Building base aerobic capacity and musculo-skeletal resilience. Focus on consistent, low-intensity volume.
      </p>
      <div className="flex flex-col gap-2 relative z-10">
        <div className="flex justify-between font-label-mono text-label-mono">
          <span className="text-phase-foundation">Week {currentWeek}</span>
          <span className="text-on-surface-variant">of 16</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-phase-foundation rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="font-label-mono text-label-mono text-on-surface-variant/50">
          May 2026 — Aug 2026 · {16 - currentWeek} weeks remaining
          <span className="ml-3 text-phase-foundation/60 group-hover:text-phase-foundation transition-colors">
            · Jump to current week ↓
          </span>
        </div>
      </div>
    </button>
  )
}

function TrainingTimeline() {
  return (
    <section className="flex flex-col gap-3">
      <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
        Training Timeline
      </div>
      <div className="flex flex-col gap-3">
        {phases.map(p => {
          const meta = PHASE_META[p.name] ?? PHASE_META.Taper
          return (
            <div
              key={p.id}
              className={`bg-surface-container-low rounded-xl border p-5 flex items-center gap-4 transition-opacity ${
                p.active
                  ? `border-${meta.color}/30`
                  : 'border-white/5 opacity-70'
              }`}
            >
              <span className={`material-symbols-outlined text-${meta.color} text-[22px]`}>{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-headline-md text-headline-md text-on-surface">{p.name}</div>
                <div className="font-label-mono text-label-mono text-on-surface-variant mt-0.5">{p.dates}</div>
              </div>
              {p.active ? (
                <div className="flex items-center gap-2 bg-success-green/10 border border-success-green/20 px-2.5 py-1 rounded-full shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
                  <span className="font-label-mono text-[10px] text-success-green uppercase tracking-wider">Active</span>
                </div>
              ) : (
                <span className="font-label-mono text-label-mono text-on-surface-variant/40 uppercase shrink-0">Upcoming</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AccordionWeek({ w, isCurrent, isPast, actual }) {
  const [open, setOpen] = useState(isCurrent)
  const targetKm = parseFloat(w.total)
  const actualKm = actual != null ? parseFloat(actual.toFixed(1)) : null
  const hasActual = actualKm != null && actualKm > 0

  const actualColor = !hasActual
    ? 'text-on-surface-variant/40'
    : actualKm >= targetKm
      ? 'text-success-green'
      : isCurrent
        ? 'text-primary'
        : 'text-error'

  return (
    <article
      id={isCurrent ? 'current-week-mobile' : undefined}
      className={`bg-surface-container-low rounded-xl border overflow-hidden ${
        isCurrent ? 'border-primary/30' : 'border-white/5'
      } ${isPast ? 'opacity-50' : ''}`}
    >
      <button
        className="w-full flex items-center justify-between p-5 hover:bg-surface-container-high/50 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-2">
            <span className={`font-headline-md text-headline-md ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
              Week {w.week}
            </span>
            {w.deload && (
              <span className="font-label-mono text-[10px] px-2 py-0.5 border border-tertiary/20 bg-tertiary/10 text-tertiary rounded uppercase tracking-widest">
                Recovery
              </span>
            )}
          </div>
          <span className="font-label-mono text-label-mono text-on-surface-variant">
            {getWeekDates(w.week)}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {hasActual && (
            <span className={`font-label-mono text-label-mono ${actualColor}`}>{actualKm}km</span>
          )}
          <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {[
              { label: 'Run 1', val: w.run1,    icon: 'directions_run' },
              { label: 'Run 2', val: w.run2,    icon: 'directions_run' },
              { label: 'Long Run', val: w.longRun, icon: 'timer', highlight: true },
            ].map(r => (
              <div
                key={r.label}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  r.highlight
                    ? 'border border-primary/20 bg-primary/5'
                    : 'bg-surface-container-highest/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[20px] ${r.highlight ? 'text-primary' : 'text-phase-foundation'}`}>
                    {r.icon}
                  </span>
                  <span className={`font-body-md text-body-md ${r.highlight ? 'text-primary-fixed-dim font-medium' : 'text-on-surface'}`}>
                    {r.label}
                  </span>
                </div>
                <span className={`font-label-mono text-label-mono font-bold ${r.highlight ? 'text-primary-fixed-dim' : 'text-on-surface'}`}>
                  {r.val}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-highest/20">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">fitness_center</span>
              <span className="font-label-mono text-label-mono text-on-surface-variant">{w.gym}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-highest/20">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">directions_bike</span>
              <span className="font-label-mono text-label-mono text-on-surface-variant">{w.cycling}</span>
            </div>
          </div>

          {w.notes && (
            <div className="p-4 rounded-lg bg-surface-dim border border-white/5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">edit_note</span>
                <span className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider">Coach's Notes</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface/80">{w.notes}</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function DesktopTable({ planWeeks, currentWeek, weekActuals }) {
  return (
    <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-white/5">
            {['Wk', 'Dates', 'Run 1', 'Run 2', 'Long Run', 'Target', 'Actual', 'Gym', 'Cycling'].map(h => (
              <th
                key={h}
                className="px-4 py-3 text-left font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest font-normal whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planWeeks.map(w => {
            const isCurrent = w.week === currentWeek
            const isPast    = w.week < currentWeek
            const actual    = weekActuals[w.week]
            const targetKm  = parseFloat(w.total)
            const actualKm  = actual != null ? parseFloat(actual.toFixed(1)) : null

            const actualColor = actualKm == null
              ? 'text-on-surface-variant/30'
              : actualKm >= targetKm
                ? 'text-success-green'
                : isCurrent
                  ? 'text-primary'
                  : 'text-error'

            return (
              <React.Fragment key={w.week}>
                <tr
                  id={isCurrent ? 'current-week-desktop' : undefined}
                  className={`border-b ${w.notes ? 'border-white/0' : 'border-white/5'} ${
                    isCurrent ? 'bg-primary/5' : w.deload ? 'bg-tertiary/5' : 'hover:bg-surface-container-high/30'
                  } ${isPast ? 'opacity-40' : ''} transition-colors`}
                  style={{ borderLeft: `3px solid ${isCurrent ? '#ffb690' : w.deload ? '#93ccff' : 'transparent'}` }}
                >
                  <td className={`px-4 py-3 font-label-mono text-label-mono ${isCurrent ? 'text-primary' : w.deload ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                    {w.week}{isCurrent ? ' ↓' : ''}
                  </td>
                  <td className="px-4 py-3 font-label-mono text-label-mono text-on-surface-variant whitespace-nowrap">{getWeekDates(w.week)}</td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">{w.run1}</td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">{w.run2}</td>
                  <td className="px-4 py-3 font-body-md text-body-md text-on-surface">{w.longRun}</td>
                  <td className="px-4 py-3 font-label-mono text-label-mono text-primary font-medium">{w.total}</td>
                  <td className={`px-4 py-3 font-label-mono text-label-mono font-medium ${actualColor}`}>
                    {actualKm != null && actualKm > 0 ? `${actualKm}km` : '—'}
                  </td>
                  <td className="px-4 py-3 font-label-mono text-label-mono text-on-surface-variant">{w.gym}</td>
                  <td className="px-4 py-3 font-label-mono text-label-mono text-on-surface-variant">{w.cycling}</td>
                </tr>
                {w.notes && (
                  <tr
                    className={`border-b border-white/5 ${isCurrent ? 'bg-primary/5' : w.deload ? 'bg-tertiary/5' : ''} ${isPast ? 'opacity-40' : ''}`}
                    style={{ borderLeft: `3px solid ${isCurrent ? '#ffb690' : w.deload ? '#93ccff' : 'transparent'}` }}
                  >
                    <td colSpan={9} className="px-4 pb-3 pt-0 font-body-md text-body-md text-primary/70 italic">
                      {w.notes}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Phases({ currentWeek }) {
  const { activities }       = useActivities()
  const { weeks: dbWeeks }   = usePlanWeeks()
  const planWeeks            = dbWeeks ?? phase1Weeks

  const weekActuals = useMemo(() => {
    const map = {}
    activities.forEach(a => {
      if (!['Run', 'TrailRun', 'VirtualRun'].includes(a.activity_type)) return
      const km = parseFloat(a.distance_km || 0)
      map[a.week_number] = (map[a.week_number] ?? 0) + km
    })
    return map
  }, [activities])

  function scrollToCurrentWeek() {
    // md breakpoint = 768px; pick the element that's actually rendered
    const id = window.innerWidth >= 768 ? 'current-week-desktop' : 'current-week-mobile'
    const el = document.getElementById(id)
    if (!el) return
    const offset = 72 // sticky nav height
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col gap-10">

      <PhaseHeroCard currentWeek={currentWeek} onScrollToCurrentWeek={scrollToCurrentWeek} />

      <TrainingTimeline />

      {/* Phase detail heading */}
      <div className="flex flex-col gap-2">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Foundation — Week by Week
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant">
          All running is easy pace — genuinely conversational. Every 4th week is a deload.
        </p>
      </div>

      {/* Mobile: accordion */}
      <div className="flex flex-col gap-3 md:hidden">
        {planWeeks.map(w => (
          <AccordionWeek
            key={w.week}
            w={w}
            isCurrent={w.week === currentWeek}
            isPast={w.week < currentWeek}
            actual={weekActuals[w.week]}
          />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <DesktopTable planWeeks={planWeeks} currentWeek={currentWeek} weekActuals={weekActuals} />
      </div>

      {/* Legend (desktop only) */}
      <div className="hidden md:flex flex-wrap gap-x-5 gap-y-1.5 font-label-mono text-label-mono">
        <span className="text-primary">● Current week</span>
        <span className="text-tertiary">↓ Deload week</span>
        <span className="text-success-green">Actual in green = on/over target</span>
        <span className="opacity-40">Dimmed = complete</span>
      </div>

      {/* Phase 1 Exit Targets */}
      <section className="flex flex-col gap-4">
        <div className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-widest">
          Phase 1 Exit Targets
        </div>
        <div className="bg-surface-container-low rounded-xl border border-white/5 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Long run',          '15–17km comfortably'],
            ['Weekly mileage',    '25–30km'],
            ['Easy pace',         'Drifting to 6:00–6:30/km naturally'],
            ['Cycling',           '50km+ rides with solid fuelling'],
            ['Body feel',         'Robust, not managed'],
            ['Garmin prediction', 'Should show clear improvement'],
          ].map(([k, v]) => (
            <div key={k}>
              <span className="font-label-mono text-label-mono text-on-surface-variant">{k}: </span>
              <span className="font-body-md text-body-md text-on-surface">{v}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
