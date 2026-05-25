'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'

interface CoverSectionProps {
  onOpen: () => void
  onOpenStart?: () => void
}

export default function CoverSection({ onOpen, onOpenStart }: CoverSectionProps) {
  const searchParams = useSearchParams()
  const params = useParams()
  const slugParam = params?.slug as string | undefined

  const [guestName, setGuestName] = useState<string | null>(null)
  const [guestPrefix, setGuestPrefix] = useState('')
  const [guestSuffix, setGuestSuffix] = useState('')
  const [guestLoaded, setGuestLoaded] = useState(false)

  // Fetch guest name from slug path, query params, or fallback to ?to=
  useEffect(() => {
    // Priority 1: Slug-based URL path (e.g. /budi-santoso)
    if (slugParam) {
      fetch(`/api/guests/${slugParam}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.name) {
            setGuestPrefix(data.prefix || '')
            setGuestName(data.name)
            setGuestSuffix(data.suffix || '')
          }
          setGuestLoaded(true)
        })
        .catch(() => setGuestLoaded(true))
      return
    }

    // Priority 2: Query param ?guestSlug= or ?guest= (code-based lookup)
    const guestSlug = searchParams.get('guestSlug')
    const guestCode = searchParams.get('guest')

    if (guestSlug) {
      fetch(`/api/guests/lookup?slug=${encodeURIComponent(guestSlug)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.name) {
            setGuestPrefix(data.prefix || '')
            setGuestName(data.name)
            setGuestSuffix(data.suffix || '')
          }
          setGuestLoaded(true)
        })
        .catch(() => setGuestLoaded(true))
      return
    }

    if (guestCode) {
      fetch(`/api/guests/lookup?code=${encodeURIComponent(guestCode)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.name) {
            setGuestPrefix(data.prefix || '')
            setGuestName(data.name)
            setGuestSuffix(data.suffix || '')
          }
          setGuestLoaded(true)
        })
        .catch(() => setGuestLoaded(true))
      return
    }

    // Priority 3: Legacy ?to= query param (backward compatible)
    setGuestName(searchParams.get('to'))
    setGuestLoaded(true)
  }, [slugParam, searchParams])

  const [isOpening, setIsOpening] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'leaning' | 'blooming' | 'breathing' | 'dissolving' | 'darkness'>('idle')
  const containerRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const petalContainerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  // Parallax on mouse move (desktop only)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isOpening) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const nx = (e.clientX - centerX) / (rect.width / 2)
      const ny = (e.clientY - centerY) / (rect.height / 2)
      mouseRef.current = { x: nx, y: ny }

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(${-nx * 2.5}px, ${-ny * 2.5}px, 0)`
      }
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(${nx * 1.5}px, ${ny * 1.5}px, 0)`
      }
      if (petalContainerRef.current) {
        petalContainerRef.current.style.transform = `translate3d(${nx * 8}px, ${ny * 5}px, 0)`
      }
    }

    const handleMouseLeave = () => {
      if (bgRef.current) bgRef.current.style.transform = 'translate3d(0, 0, 0)'
      if (contentRef.current) contentRef.current.style.transform = 'translate3d(0, 0, 0)'
      if (petalContainerRef.current) petalContainerRef.current.style.transform = 'translate3d(0, 0, 0)'
    }

    window.addEventListener('mousemove', handleMouseMove)
    containerRef.current?.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isOpening])

  // The signature moment — entering their world
  const handleOpen = useCallback(() => {
    if (isOpening) return
    setIsOpening(true)

    // Start music IMMEDIATELY — don't wait for animation to finish
    onOpenStart?.()

    // Phase 1: Lean in — content draws closer, like leaning toward a door (300ms)
    setPhase('leaning')

    // Phase 2: Golden bloom — warm light blooms from center, candle being lit
    setTimeout(() => setPhase('blooming'), 250)

    // Phase 2b: Breathe — the world responds to your touch, a subtle pulse of life
    setTimeout(() => setPhase('breathing'), 700)

    // Phase 3: Dissolve — the cover softly melts away, not a hard cut
    setTimeout(() => setPhase('dissolving'), 1000)

    // Phase 4: Brief darkness — the breath before the story begins
    setTimeout(() => setPhase('darkness'), 1800)

    // Phase 5: Enter the story
    setTimeout(() => onOpen(), 2200)
  }, [isOpening, onOpen, onOpenStart])

  // Two dried leaves on the cover — hinting at the story to come
  const leafConfigs = [
    { left: 25, size: 22, duration: 14, delay: 0.5, opacity: 0.35, isLeafA: true },
    { left: 70, size: 20, duration: 16, delay: 1.2, opacity: 0.3, isLeafA: false },
  ]

  return (
    <section
      ref={containerRef}
      data-section="cover"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        transition: 'opacity 0.8s ease, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: phase === 'darkness' ? 0 : 1,
        // Signature moment: the world breathes — subtle scale pulse when opening
        transform: phase === 'breathing' ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Background Image — warm, cinematic with parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-poster.jpg')",
          transition: 'transform 0.6s ease-out',
          willChange: 'transform',
        }}
      />
      <div className="hero-overlay absolute inset-0" />

      {/* Vignette — dark warm edges, stronger for text readability */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at center, transparent 15%, rgba(26,21,16,0.6) 100%)'
      }} />

      {/* Subtle golden light drift — like moonlight shifting */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse, rgba(201,169,110,0.04) 0%, transparent 50%)',
          animation: 'goldenLightDrift 14s ease-in-out infinite alternate',
        }}
      />

      {/* Warm ambient breathing glow — like a candle behind parchment */}
      <div
        className="absolute inset-0 pointer-events-none z-[2.5]"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(201,169,110,0.03) 0%, transparent 55%)',
          animation: 'warmGlow 6s ease-in-out infinite alternate',
        }}
      />

      {/* Light leak streak — warm golden ray from top-left */}
      <div
        className="absolute inset-0 pointer-events-none z-[2.8]"
        style={{
          background: 'linear-gradient(135deg, rgba(201,169,110,0.04) 0%, rgba(201,169,110,0.01) 30%, transparent 50%)',
          animation: 'goldenLightDrift 18s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Cinematic dust particles layer — motes caught in golden light */}
      <div
        className="absolute inset-0 pointer-events-none z-[2.6] mix-blend-screen"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"150\" height=\"150\" viewBox=\"0 0 150 150\"%3E%3Cfilter id=\"d\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.7\" numOctaves=\"2\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23d)\" opacity=\"0.02\"/%3E%3C/svg%3E')",
          opacity: 0.15,
        }}
      />

      {/* Film grain — analog warmth */}
      <div
        className="absolute inset-0 pointer-events-none z-[1.5] mix-blend-overlay"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\" opacity=\"0.04\"/%3E%3C/svg%3E')",
          opacity: 0.3,
        }}
      />

      {/* ─── THE SIGNATURE MOMENT ─── */}

      {/* Bloom layer — warm golden light expanding from center */}
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.25) 0%, rgba(201,169,110,0.08) 40%, transparent 70%)',
          opacity: phase === 'blooming' || phase === 'breathing' || phase === 'dissolving' ? 1 : 0,
          transform: phase === 'blooming' ? 'scale(1)' : phase === 'breathing' ? 'scale(1.05)' : phase === 'dissolving' ? 'scale(1.5)' : 'scale(0.5)',
          transition: 'opacity 0.6s ease, transform 0.8s ease',
        }}
      />

      {/* Cinematic light sweep — sunlight through a doorway */}
      <div
        className="absolute inset-0 pointer-events-none z-[3.5]"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(201,169,110,0.15) 45%, rgba(232,200,120,0.2) 50%, rgba(201,169,110,0.15) 55%, transparent 70%)',
          opacity: phase === 'dissolving' ? 1 : 0,
          transform: phase === 'dissolving' ? 'translateX(0%)' : 'translateX(-100%)',
          transition: 'opacity 0.3s ease, transform 0.6s ease',
        }}
      />

      {/* Golden light rays — like sunbeams through a doorway, appear during opening */}
      <div
        className="absolute inset-0 pointer-events-none z-[3.3]"
        style={{
          background: `
            linear-gradient(170deg, transparent 35%, rgba(201,169,110,0.06) 40%, rgba(201,169,110,0.12) 45%, rgba(232,200,120,0.08) 50%, transparent 55%),
            linear-gradient(190deg, transparent 40%, rgba(201,169,110,0.04) 44%, rgba(201,169,110,0.08) 48%, transparent 53%)
          `,
          opacity: phase === 'blooming' || phase === 'breathing' ? 1 : 0,
          transform: phase === 'dissolving' ? 'translateY(-5%)' : 'translateY(0)',
          transition: 'opacity 0.8s ease, transform 1s ease',
        }}
      />

      {/* Darkness layer — the breath before the story */}
      <div
        className="absolute inset-0 pointer-events-none z-[4]"
        style={{
          background: 'rgba(26, 21, 16, 0.95)',
          opacity: phase === 'darkness' ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Corner ornaments */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute top-6 left-6 w-16 h-16 border-t border-l opacity-30" style={{ borderColor: 'var(--gold)' }} />
        <div className="absolute top-6 right-6 w-16 h-16 border-t border-r opacity-30" style={{ borderColor: 'var(--gold)' }} />
        <div className="absolute bottom-6 left-6 w-16 h-16 border-b border-l opacity-30" style={{ borderColor: 'var(--gold)' }} />
        <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r opacity-30" style={{ borderColor: 'var(--gold)' }} />
      </div>

      {/* Depth of field layer — foreground blur that clears during opening */}
      <div
        className="absolute inset-0 pointer-events-none z-[19]"
        style={{
          backdropFilter: phase === 'idle' ? 'blur(1px)' : 'blur(0px)',
          WebkitBackdropFilter: phase === 'idle' ? 'blur(1px)' : 'blur(0px)',
          transition: 'backdrop-filter 1.5s ease, -webkit-backdrop-filter 1.5s ease',
        }}
      />

      {/* Two dried leaves drifting — the beginning of their journey */}
      <div
        ref={petalContainerRef}
        className="absolute inset-0 z-30 pointer-events-none"
        style={{ transition: 'transform 0.8s ease-out', willChange: 'transform' }}
      >
        {leafConfigs.map((config, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute"
            style={{
              left: `${config.left}%`,
              top: '-5%',
              width: config.size,
              height: config.size * 1.3,
              animation: `petalDrift ${config.duration}s ease-out ${config.delay}s forwards`,
              opacity: 0,
            }}
          >
            {config.isLeafA ? (
              <svg width="100%" height="100%" viewBox="0 0 28 36" fill="none">
                <path d="M14 0C14 0 22 6 24 14C26 22 20 34 14 36C8 34 2 22 4 14C6 6 14 0 14 0Z"
                  fill={`rgba(139,100,50,${config.opacity})`} stroke={`rgba(92,74,50,${config.opacity * 0.7})`} strokeWidth="0.5"/>
                <path d="M14 3L14 33" stroke={`rgba(92,74,50,${config.opacity * 0.8})`} strokeWidth="0.6" strokeLinecap="round"/>
                <path d="M14 8L9 5" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M14 8L19 5" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M14 14L8 11" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M14 14L20 11" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="100%" height="100%" viewBox="0 0 26 34" fill="none">
                <path d="M13 0C13 0 21 4 24 12C26 20 20 30 13 34C6 30 0 20 2 12C5 4 13 0 13 0Z"
                  fill={`rgba(107,66,38,${config.opacity})`} stroke={`rgba(92,74,50,${config.opacity * 0.7})`} strokeWidth="0.5"/>
                <path d="M13 3C13 3 12.5 17 13 31" stroke={`rgba(92,74,50,${config.opacity * 0.8})`} strokeWidth="0.6" strokeLinecap="round" fill="none"/>
                <path d="M13 7L7 4" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M13 7L19 4" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M12.5 13L6 10" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
                <path d="M12.5 13L19 10" stroke={`rgba(92,74,50,${config.opacity * 0.5})`} strokeWidth="0.4" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Content — with cinematic entrance */}
      <div
        ref={contentRef}
        className="relative z-[25] w-full max-w-md mx-auto px-6 text-center"
        style={{
          transition: 'transform 0.6s ease-out, opacity 0.6s ease',
          willChange: 'transform, opacity',
          // Lean in: content draws closer when opening
          transform: phase === 'leaning' ? 'translate3d(0, 0, 0) scale(1.04)' :
                     phase === 'blooming' ? 'translate3d(0, 0, 0) scale(1.06)' :
                     phase === 'breathing' ? 'translate3d(0, 0, 0) scale(1.06)' :
                     phase === 'dissolving' ? 'translate3d(0, 0, 0) scale(1.08)' :
                     undefined,
          opacity: phase === 'dissolving' ? 0.6 : phase === 'darkness' ? 0 : 1,
        }}
      >
        {/* Seal */}
        <div
          className="w-16 h-16 mx-auto mb-10 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, var(--gold-light), var(--gold-dark))',
            boxShadow: '0 2px 12px rgba(201,169,110,0.3), 0 0 30px rgba(201,169,110,0.1)',
            opacity: 0.9,
            animation: 'warmGlow 4s ease-in-out infinite alternate',
          }}
        >
          <span className="text-lg" style={{ fontFamily: 'var(--font-script)', color: 'var(--cream)' }}>
            I&A
          </span>
        </div>

        <p className="tracking-[0.35em] uppercase text-[10px] sm:text-xs mb-4"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--gold-light)', opacity: 0.85, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          The Wedding Invitation of
        </p>

        {/* Names with handwriting reveal */}
          <h2
          className="text-4xl sm:text-5xl mb-3"
          style={{
            fontFamily: 'var(--font-script)',
            color: 'var(--gold-light)',
            textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(201,169,110,0.2)',
            clipPath: 'inset(0 100% 0 0)',
            animation: 'handwritingReveal 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards',
          }}
        >
          Irwan &amp; Anira
        </h2>

        <div className="max-w-[200px] mx-auto mb-6" style={{ opacity: 0.4 }}>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
        </div>

        <p className="text-sm tracking-[0.2em] mb-6" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0.85, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          05 . 07 . 2026
        </p>

        {/* Guest name — supports slug path, guestSlug/guest query, and legacy ?to= */}
        <div className="mb-10">
          <p
            className="text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-1"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--gold-light)', opacity: 0.75, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
          >
            Kepada Yth.
          </p>
          <p
            className="text-base sm:text-lg italic"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0.9, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {guestPrefix && <span>{guestPrefix} </span>}{guestName || 'Tamu Undangan'}{guestSuffix && <span> {guestSuffix}</span>}
          </p>
        </div>

        {/* The button that opens the door */}
        <button
          onClick={handleOpen}
          disabled={isOpening}
          className="px-8 py-3 border border-[var(--gold)]/60 text-[var(--gold-light)] tracking-[0.3em] uppercase text-[10px] sm:text-xs
            hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/80 transition-all duration-700 cursor-pointer"
          style={{ fontFamily: 'var(--font-body)', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          {isOpening ? '' : 'Buka Undangan'}
        </button>
      </div>
    </section>
  )
}
