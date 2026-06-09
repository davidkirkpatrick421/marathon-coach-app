import { useState, useEffect } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed bottom-8 right-6 md:right-10 z-50 w-10 h-10 rounded-full
        bg-surface-container-high border border-white/10 text-on-surface-variant
        flex items-center justify-center
        hover:bg-surface-container-highest hover:text-on-surface hover:border-white/20
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'}`}
    >
      <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
    </button>
  )
}
