'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

interface CoverHubProps {
  onChoose: (view: 'story' | 'info') => void
}

export default function CoverHub({ onChoose }: CoverHubProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Entrance animation — fade in from black (continuing from cover dissolve)
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: 'power2.out' }
    )

    // Stagger the buttons
    gsap.fromTo('.hub-button',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out', delay: 0.8 }
    )
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Same dark background as cover */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-poster.jpg')" }}
      />
      <div className="hero-overlay absolute inset-0" />

      {/* Vignette — dark warm edges */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(26,21,16,0.5) 100%)'
      }} />

      {/* Subtle golden light drift */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse, rgba(201,169,110,0.08) 0%, transparent 50%)',
          animation: 'goldenLightDrift 14s ease-in-out infinite alternate',
        }}
      />

      <div className="relative z-[25] w-full max-w-md mx-auto px-6 text-center">
        {/* Seal */}
        <div
          className="w-16 h-16 mx-auto mb-8 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, var(--gold-light), var(--gold-dark))',
            boxShadow: '0 2px 12px rgba(201,169,110,0.3)',
          }}
        >
          <span className="text-lg" style={{ fontFamily: 'var(--font-script)', color: 'var(--cream)' }}>
            I&A
          </span>
        </div>

        <h2
          className="text-4xl sm:text-5xl mb-3"
          style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)' }}
        >
          Irwan &amp; Anira
        </h2>
        <p
          className="text-sm tracking-[0.2em] mb-12"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0.7 }}
        >
          05 . 07 . 2026
        </p>

        <div className="flex flex-col gap-4 max-w-xs mx-auto">
          {/* Info Acara — TOP (more important) */}
          <button
            className="hub-button w-full px-8 py-4 border border-[var(--gold)]/60 text-[var(--gold-light)] tracking-[0.25em] uppercase text-xs hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/80 transition-all duration-700 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)', opacity: 0 }}
            onClick={() => onChoose('info')}
          >
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Info Acara
            </span>
          </button>

          {/* Cerita Kami — BOTTOM */}
          <button
            className="hub-button w-full px-8 py-4 border border-[var(--gold)]/60 text-[var(--gold-light)] tracking-[0.25em] uppercase text-xs hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/80 transition-all duration-700 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)', opacity: 0 }}
            onClick={() => onChoose('story')}
          >
            <span className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              Cerita Kami
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
