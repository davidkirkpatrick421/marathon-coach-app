const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function WeeklyProgressRing({ actualKm, targetKm, currentWeek }) {
  const pct = targetKm > 0 ? Math.min(actualKm / targetKm, 1) : 0
  const offset = CIRCUMFERENCE * (1 - pct)

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="#F97316"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="flex flex-col items-center text-center z-10 select-none">
          <span className="font-label-mono text-label-mono text-on-surface-variant mb-1">THIS WEEK</span>
          <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface leading-none">
            {actualKm.toFixed(1)}
            <span className="font-headline-md text-headline-md text-on-surface-variant ml-1">km</span>
          </span>
          <span className="font-label-mono text-label-mono text-primary mt-2">
            Target: {targetKm}km
          </span>
        </div>
      </div>
    </div>
  )
}
