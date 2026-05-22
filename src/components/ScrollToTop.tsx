'use client'

import { useState, useEffect } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 left-6 w-12 h-12 rounded-full border-2 border-[var(--gold)] flex items-center justify-center
        shadow-lg cursor-pointer transition-all duration-500 ${
          visible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      style={{ background: 'var(--cream)', color: 'var(--gold-dark)', position: 'fixed', zIndex: 99999 }}
      aria-label="Scroll to top"
      title="Kembali ke atas"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
