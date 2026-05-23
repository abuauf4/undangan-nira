'use client'

import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'

interface PreloaderProps {
  onComplete: () => void
  groomName: string
  brideName: string
}

export default function Preloader({ onComplete, groomName, brideName }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const groomCharsRef = useRef<HTMLSpanElement[]>([])
  const brideCharsRef = useRef<HTMLSpanElement[]>([])
  const ampersandRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const ornamentRef = useRef<HTMLDivElement>(null)
  const inkDropRef = useRef<HTMLDivElement>(null)
  const goldenTintRef = useRef<HTMLDivElement>(null)

  const groomFirst = groomName.split(' ')[0]
  const brideFirst = brideName.split(' ')[0]

  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      requestAnimationFrame(() => {
        setProgress(100)
        setTimeout(() => onCompleteRef.current(), 500)
      })
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        // Cinematic fade out — "the projector turning on"
        // Golden tint appears during the last 0.5s
        gsap.to(goldenTintRef.current, {
          opacity: 0.15,
          duration: 0.5,
          ease: 'power1.in',
        })

        // Scale up slightly + fade out
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.03,
          duration: 1.2,
          ease: 'power2.inOut',
          onComplete: () => onCompleteRef.current(),
        })
      },
    })

    // Ink drop — a single dot that expands softly
    if (inkDropRef.current) {
      tl.fromTo(inkDropRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 0.3, duration: 1.5, ease: 'power2.out' },
        0
      )
    }

    // Progress bar — thin, elegant (2.5s for faster feel)
    tl.to(progressRef.current, {
      width: '100%',
      duration: 2.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (progressRef.current) {
          const width = progressRef.current.style.width
          setProgress(Math.min(100, parseInt(width) || 0))
        }
      },
    }, 0.5)

    // Animate groom name — slightly faster stagger for less mechanical feel
    tl.fromTo(
      groomCharsRef.current,
      { opacity: 0, y: 15, filter: 'blur(4px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
      },
      0.8
    )

    // Ampersand — snappier duration
    tl.fromTo(
      ampersandRef.current,
      { opacity: 0, scale: 0.8, filter: 'blur(4px)' },
      {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.6,
        ease: 'power2.out',
      },
      1.5
    )

    // Animate bride name — slightly faster stagger
    tl.fromTo(
      brideCharsRef.current,
      { opacity: 0, y: 15, filter: 'blur(4px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
      },
      1.8
    )

    // Ornament — subtle breath in
    tl.fromTo(
      ornamentRef.current,
      { opacity: 0, scaleX: 0 },
      {
        opacity: 0.4,
        scaleX: 1,
        duration: 1,
        ease: 'power2.out',
      },
      2.5
    )

    // Hold — let the names breathe
    tl.to({}, { duration: 0.8 })

    return () => { tl.kill() }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #F5EDDF 0%, #EDE4D4 50%, #F5EDDF 100%)',
        transformOrigin: 'center center',
      }}
    >
      {/* Golden tint overlay — appears during cinematic exit */}
      <div
        ref={goldenTintRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,169,110,0.2) 0%, transparent 60%)',
          opacity: 0,
        }}
      />

      {/* Vignette overlay — dark edges for cinematic depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)'
      }} />

      {/* Ink drop — subtle circle that spreads */}
      <div
        ref={inkDropRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)',
          opacity: 0,
        }}
      />

      {/* Corner borders — minimal, thin */}
      <div className="absolute top-10 left-10 w-16 h-16 border-t border-l opacity-20" style={{ borderColor: 'var(--gold)' }} />
      <div className="absolute top-10 right-10 w-16 h-16 border-t border-r opacity-20" style={{ borderColor: 'var(--gold)' }} />
      <div className="absolute bottom-10 left-10 w-16 h-16 border-b border-l opacity-20" style={{ borderColor: 'var(--gold)' }} />
      <div className="absolute bottom-10 right-10 w-16 h-16 border-b border-r opacity-20" style={{ borderColor: 'var(--gold)' }} />

      {/* Bismillah — quiet, reverent */}
      <p
        className="text-lg sm:text-xl mb-10 opacity-50"
        style={{ fontFamily: 'var(--font-arabic)', color: 'var(--brown-light)' }}
      >
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </p>

      {/* Groom Name — slow reveal */}
      <div className="flex mb-1">
        {groomFirst.split('').map((char, i) => (
          <span
            key={`g-${i}`}
            ref={(el) => { if (el) groomCharsRef.current[i] = el }}
            className="text-4xl sm:text-6xl inline-block"
            style={{
              fontFamily: 'var(--font-script)',
              color: 'var(--gold-dark)',
              willChange: 'transform, opacity, filter',
              display: 'inline-block',
              opacity: 0,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Ampersand */}
      <div className="my-2 flex items-center justify-center">
        <span
          ref={ampersandRef}
          className="text-2xl sm:text-3xl"
          style={{
            fontFamily: 'var(--font-script)',
            color: 'var(--gold)',
            opacity: 0,
            willChange: 'transform, opacity, filter',
          }}
        >
          &amp;
        </span>
      </div>

      {/* Bride Name */}
      <div className="flex mb-6">
        {brideFirst.split('').map((char, i) => (
          <span
            key={`b-${i}`}
            ref={(el) => { if (el) brideCharsRef.current[i] = el }}
            className="text-4xl sm:text-6xl inline-block"
            style={{
              fontFamily: 'var(--font-script)',
              color: 'var(--gold-dark)',
              willChange: 'transform, opacity, filter',
              display: 'inline-block',
              opacity: 0,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Ornament divider */}
      <div
        ref={ornamentRef}
        className="max-w-[160px] w-full mb-10"
        style={{ opacity: 0, willChange: 'transform, opacity' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
      </div>

      {/* Progress bar — thin, barely there */}
      <div className="w-40 sm:w-52 relative">
        <div className="h-px w-full" style={{ background: 'var(--gold)', opacity: 0.2 }} />
        <div
          ref={progressRef}
          className="h-px absolute top-0 left-0"
          style={{ background: 'var(--gold)', width: '0%', willChange: 'width', opacity: 0.6 }}
        />
        <p
          className="text-center mt-4 text-[10px] tracking-[0.4em] uppercase"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-soft)', opacity: 0.5 }}
        >
          {progress < 100 ? 'membuka diary...' : 'selamat datang'}
        </p>
      </div>

      {/* Credit — subtle, bottom of preloader */}
      <p
        className="absolute bottom-6 text-[7px] sm:text-[8px] tracking-[0.3em] uppercase"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-soft)', opacity: 0.3 }}
      >
        Dibuat oleh Nauka Motion
      </p>
    </div>
  )
}
