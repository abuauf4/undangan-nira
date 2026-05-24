'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DriedLeaves from '@/components/DriedLeaves'
import Preloader from '@/components/Preloader'
import SmoothScroll from '@/components/SmoothScroll'
import CoverSectionComponent from '@/components/CoverSection'
import CoverHub from '@/components/CoverHub'
import MusicPlayerComponent from '@/components/MusicPlayer'
import GuestWishes from '@/components/GuestWishes'
import RSVPSection from '@/components/RSVPSection'
import DigitalEnvelope from '@/components/DigitalEnvelope'
import ScrollToTop from '@/components/ScrollToTop'
import { fadeIn, slideIn, scaleIn, initCursorFollower, prefersReducedMotion } from '@/lib/animations'
import { useWeddingConfig, type WeddingData } from '@/hooks/useWeddingConfig'
import { getWeddingData, setWeddingData } from '@/lib/wedding-data'
import { handwritingReveal } from '@/lib/handwriting-reveal'
import { useCountdown } from '@/hooks/useCountdown'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/* ═══════════════════════════════════════════════════════════
   AUTO-SCROLL NOTE:
   Speed zones (getBoundingClientRect, real-time detection):
   Normal 1x → Countdown 2x → Acara 2x → Gallery 1x → RSVP→Wishes 2x → Closing 1x
   Only diary gets cinematic lock (full stop via custom events).
   Closing: NO LOCK. Normal speed + ScrollTrigger at top -100% = animations start when section is fully past viewport top.
   No pause = no deadlock from ScrollTrigger.refresh() after diary pin removal.
   Auto-scroll starts 10 seconds after cover opens.
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   1. CURSOR FOLLOWER — Gold dot, desktop only, barely there
   ═══════════════════════════════════════════════════════════ */
function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cursorRef.current) return
    const cleanup = initCursorFollower(cursorRef.current)
    return () => { cleanup?.() }
  }, [])

  if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) return null

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-[9998] hidden sm:block"
      style={{
        background: 'var(--gold)',
        opacity: 0.3,
        mixBlendMode: 'difference',
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  )
}

/* ═══════════════════════════════════════════════════════════
   1c. STORY PROGRESS — Thin gold line on left side
   Fills vertically based on scroll progress
   Very subtle — barely there track, thin gold fill
   ═══════════════════════════════════════════════════════════ */
function StoryProgress() {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!fillRef.current) return
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      const progress = Math.min(scrollTop / docHeight, 1)
      fillRef.current.style.transform = `scaleY(${progress})`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 h-full"
      style={{ width: '2px', zIndex: 9999 }}
      aria-hidden="true"
    >
      {/* Track — barely visible */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(201,169,110,0.1)' }}
      />
      {/* Fill — thin gold */}
      <div
        ref={fillRef}
        className="absolute top-0 left-0 w-full h-full origin-top"
        style={{ background: 'var(--gold)', transform: 'scaleY(0)', transformOrigin: 'top center' }}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   2. BISMILLAH — Sacred, still, reverent
   The opening of every good thing
   Cinema dark atmosphere, more moody
   ═══════════════════════════════════════════════════════════ */
function BismillahSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const arabicRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLParagraphElement>(null)
  const sourceRef = useRef<HTMLParagraphElement>(null)
  const hasAnimated = useRef(false)

  function typewriterReveal(quoteEl: HTMLParagraphElement, sourceEl: HTMLParagraphElement) {
    if (!quoteEl) return

    const fullText = quoteEl.textContent || ''
    quoteEl.innerHTML = ''

    const cursor = document.createElement('span')
    cursor.className = 'typewriter-cursor'
    cursor.textContent = '|'
    cursor.style.cssText = `
      display: inline-block;
      animation: typewriterBlink 0.7s step-end infinite;
      color: var(--gold);
      font-weight: 300;
      margin-left: 1px;
    `

    const charSpans: HTMLSpanElement[] = []
    for (let i = 0; i < fullText.length; i++) {
      const span = document.createElement('span')
      span.textContent = fullText[i]
      span.style.opacity = '0'
      span.style.display = 'inline'
      quoteEl.appendChild(span)
      charSpans.push(span)
    }
    quoteEl.appendChild(cursor)

    const tl = gsap.timeline()

    tl.to(charSpans, {
      opacity: 1,
      duration: 0.01,
      stagger: 0.04,
      ease: 'none',
      onStart: () => {
        if (sourceEl) {
          gsap.set(sourceEl, { opacity: 0, y: 10 })
        }
      },
    })

    tl.to(cursor, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => cursor.remove(),
    }, '+=0.3')

    if (sourceEl) {
      tl.to(sourceEl, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.1')
    }
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      fadeIn(sectionRef.current!, { duration: 1.2, y: 20 })

      if (arabicRef.current) {
        gsap.fromTo(arabicRef.current,
          { opacity: 0, scale: 0.9, filter: 'blur(6px)' },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            duration: 2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated.current) {
              hasAnimated.current = true
              typewriterReveal(quoteRef.current!, sourceRef.current!)
            }
          })
        },
        { threshold: 0.3 }
      )

      if (sectionRef.current) {
        observer.observe(sectionRef.current)
      }

      return () => observer.disconnect()
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} data-section="bismillah" className="cinema-dark-section cinema-vignette cinema-bloom cinema-dust py-28 px-6 text-center relative overflow-hidden" style={{ opacity: 0 }}>
      {/* Sacred mosque light — golden rays from above, like light through mosque windows */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(201,169,110,0.35) 0%, rgba(201,169,110,0.12) 30%, transparent 70%)' }} />
      {/* Light shaft accents — diagonal golden beams from above */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(165deg, rgba(201,169,110,0.08) 0%, transparent 25%, transparent 40%, rgba(201,169,110,0.05) 45%, transparent 60%)' }} />
      <div className="max-w-2xl mx-auto relative z-10">
        <p
          ref={arabicRef}
          className="text-3xl sm:text-4xl md:text-5xl mb-8 leading-relaxed"
          style={{ fontFamily: 'var(--font-arabic)', color: 'var(--gold-light)', opacity: 0 }}
        >
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
        <p
          ref={quoteRef}
          className="text-base sm:text-lg italic leading-relaxed min-h-[5em]"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)' }}
        >
          &ldquo;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.&rdquo;
        </p>
        <p
          ref={sourceRef}
          className="mt-6 text-sm"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', opacity: 0 }}
        >
          — QS. Ar-Rum: 21
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   3. COUPLE — Intimate, close
   Two souls becoming one story
   ADDED: Cinematic blur-to-clear photo animations
   ADDED: Dark moody background with vignette
   ═══════════════════════════════════════════════════════════ */
function CoupleSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const groomRef = useRef<HTMLDivElement>(null)
  const brideRef = useRef<HTMLDivElement>(null)
  const heartRef = useRef<HTMLDivElement>(null)
  const groomNameRef = useRef<HTMLHeadingElement>(null)
  const brideNameRef = useRef<HTMLHeadingElement>(null)
  const groomParentsRef = useRef<HTMLParagraphElement>(null)
  const brideParentsRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section fade
      gsap.fromTo(sectionRef.current!,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1.5,
          scrollTrigger: {
            trigger: sectionRef.current!,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )

      // Groom photo — smooth cinematic reveal, no scale to prevent glitch
      if (groomRef.current) {
        const groomTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current!,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
        // Step 1: Fade in with blur only (no scale = no layout shift glitch)
        groomTl.fromTo(groomRef.current,
          { opacity: 0, filter: 'blur(12px)' },
          { opacity: 0.6, filter: 'blur(6px)', duration: 0.8, ease: 'power2.out' }
        )
        // Step 2: Fully clear
        groomTl.to(groomRef.current,
          { opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }
        )
      }

      // Bride photo — smooth cinematic reveal, no scale to prevent glitch
      if (brideRef.current) {
        const brideTl = gsap.timeline({
          delay: 0.3,
          scrollTrigger: {
            trigger: sectionRef.current!,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        })
        // Step 1: Fade in with blur only
        brideTl.fromTo(brideRef.current,
          { opacity: 0, filter: 'blur(12px)' },
          { opacity: 0.6, filter: 'blur(6px)', duration: 0.8, ease: 'power2.out' }
        )
        // Step 2: Fully clear
        brideTl.to(brideRef.current,
          { opacity: 1, filter: 'blur(0px)', duration: 1.0, ease: 'power2.out' }
        )
      }

      // Groom name — fade in from below after photo
      if (groomNameRef.current) {
        gsap.fromTo(groomNameRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Bride name — fade in from below after photo
      if (brideNameRef.current) {
        gsap.fromTo(brideNameRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Heart — gentle reveal after both names
      if (heartRef.current) {
        gsap.fromTo(heartRef.current,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            delay: 0.6,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Parents text — gentle fade-in
      if (groomParentsRef.current) {
        gsap.fromTo(groomParentsRef.current,
          { opacity: 0, y: 8 },
          {
            opacity: 0.8,
            y: 0,
            duration: 1,
            delay: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      if (brideParentsRef.current) {
        gsap.fromTo(brideParentsRef.current,
          { opacity: 0, y: 8 },
          {
            opacity: 0.8,
            y: 0,
            duration: 1,
            delay: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} data-section="couple" className="cinema-dark-section cinema-vignette cinema-bloom cinema-dust py-28 px-6 relative overflow-hidden" style={{ opacity: 0 }}>
      {/* Candlelit intimacy — warm ambient glow from center, deeper vignette edges */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(201,169,110,0.2) 0%, rgba(201,169,110,0.06) 35%, rgba(26,21,16,0.4) 70%, rgba(26,21,16,0.7) 100%)', animation: 'candleFlicker 6s ease-in-out infinite' }} />
      {/* Warm side light — like candlelight from left */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 15% 60%, rgba(232,200,120,0.1) 0%, transparent 40%)' }} />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)' }}>
          Mempelai
        </h2>
        <p className="text-sm italic mb-10" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0.6 }}>Dua jiwa, satu kisah</p>
        <div className="ornament-divider max-w-xs mx-auto mb-14">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">
          {/* Groom */}
          <div ref={groomRef} className="text-center" style={{ opacity: 0 }}>
            <div className="couple-photo-frame w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mx-auto mb-6 border-2 border-[var(--gold)] shadow-lg">
              <img src="/images/groom.jpg" alt={getWeddingData().groom} className="w-full h-full object-cover" />
            </div>
            <h3 ref={groomNameRef} className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)', opacity: 0 }}>
              {getWeddingData().groom}
            </h3>
            <div className="ornament-divider max-w-[120px] mx-auto mb-3">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p ref={groomParentsRef} className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0 }}>
              Putra dari<br />
              <span className="not-italic font-medium" style={{ color: 'var(--cream)' }}>{getWeddingData().groomParents}</span>
            </p>
          </div>

          {/* Heart Divider — gentle float, no heartbeat */}
          <div
            ref={heartRef}
            className="text-3xl sm:text-4xl animate-float"
            style={{ color: 'var(--gold)', opacity: 0 }}
          >
            &#10084;
          </div>

          {/* Bride */}
          <div ref={brideRef} className="text-center" style={{ opacity: 0 }}>
            <div className="couple-photo-frame w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mx-auto mb-6 border-2 border-[var(--gold)] shadow-lg">
              <img src="/images/bride.jpg" alt={getWeddingData().bride} className="w-full h-full object-cover" />
            </div>
            <h3 ref={brideNameRef} className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)', opacity: 0 }}>
              {getWeddingData().bride}
            </h3>
            <div className="ornament-divider max-w-[120px] mx-auto mb-3">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p ref={brideParentsRef} className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0 }}>
              Putri dari<br />
              <span className="not-italic font-medium" style={{ color: 'var(--cream)' }}>{getWeddingData().brideParents}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   4. DIARY INTRO — Opening the diary
   Like reading someone's journal for the first time
   FIXED: Faster handwriting stagger 0.022, charDuration 0.08
   ═══════════════════════════════════════════════════════════ */
function DiaryIntroSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const topStrokeRef = useRef<HTMLDivElement>(null)
  const bottomStrokeRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      fadeIn(sectionRef.current!, { duration: 1.8, y: 20 })

      // Ink stroke draw-in — top (SLOWER, more cinematic)
      if (topStrokeRef.current) {
        const svgPath = topStrokeRef.current.querySelector('path') as SVGPathElement | null
        if (svgPath) {
          try {
            const len = svgPath.getTotalLength()
            svgPath.style.strokeDasharray = String(len)
            svgPath.style.strokeDashoffset = String(len)
            gsap.to(svgPath, {
              strokeDashoffset: 0,
              duration: 5.0,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: sectionRef.current!,
                start: 'top 50%',
                toggleActions: 'play none none none',
              },
            })
          } catch (_e) { /* fallback */ }
        }
      }

      // Ink stroke draw-in — bottom (SLOWER, more cinematic)
      if (bottomStrokeRef.current) {
        const svgPath = bottomStrokeRef.current.querySelector('path') as SVGPathElement | null
        if (svgPath) {
          try {
            const len = svgPath.getTotalLength()
            svgPath.style.strokeDasharray = String(len)
            svgPath.style.strokeDashoffset = String(len)
            gsap.to(svgPath, {
              strokeDashoffset: 0,
              duration: 5.0,
              ease: 'power2.inOut',
              delay: 1.2,
              scrollTrigger: {
                trigger: sectionRef.current!,
                start: 'top 50%',
                toggleActions: 'play none none none',
              },
            })
          } catch (_e) { /* fallback */ }
        }
      }

      // Handwriting reveal — SLOWER stagger and char duration for cinematic pacing
      if (textRef.current) {
        gsap.fromTo(textRef.current,
          { opacity: 0 },
          {
            opacity: 0.85,
            duration: 0.5,
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 50%',
              toggleActions: 'play none none none',
              onEnter: () => {
                if (!hasAnimated.current) {
                  hasAnimated.current = true
                  handwritingReveal(textRef.current!, 0.08, 0.25)
                  // Subtitle handwriting — "Cerita kami dimulai" after main quote
                  if (subtitleRef.current) {
                    handwritingReveal(subtitleRef.current!, 0.06, 0.2, 1.5)
                  }
                }
              },
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      data-section="diaryIntro"
      className="diary-paper-bg diary-lines diary-margin cinema-depth py-28 px-6 text-center relative overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Paper texture focus — warm sepia overlay for ink-drop feeling */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(180,160,120,0.12)' }} />
      {/* Aged paper warm corners — vignette with warm brown tones */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(139,100,50,0.15) 100%)' }} />
      {/* Diary entry — year + subtitle side by side */}
      <div className="max-w-xl mx-auto relative">
        {/* Year + Subtitle — side by side, handwriting reveal */}
        <div className="flex items-baseline gap-3 mb-8 text-left pl-16 sm:pl-20">
          <p
            className="text-sm tracking-wider"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--gold)', opacity: 0.6 }}
          >
            2020
          </p>
          <p
            ref={subtitleRef}
            className="text-sm sm:text-base tracking-wider min-h-[1.5em]"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)', opacity: 0.7, fontStyle: 'italic' }}
          >
            Cerita kami dimulai
          </p>
        </div>

        {/* Top ink stroke */}
        <div ref={topStrokeRef} className="ink-stroke-line mb-8 max-w-xs mx-auto">
          <svg viewBox="0 0 300 20" className="w-full h-5" fill="none">
            <path
              d="M 5 15 Q 50 2 100 12 Q 150 22 200 8 Q 250 -2 295 15"
              stroke="var(--gold)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* The diary quote */}
        <p
          ref={textRef}
          className="text-base sm:text-lg italic leading-relaxed min-h-[10em]"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown)', opacity: 0.85 }}
        >
          Tidak ada yang kebetulan di dunia ini, semua sudah tersusun rapih oleh Sang Maha Kuasa, kita tidak bisa memilih kepada siapa kita akan jatuh cinta, awal kami bertemu pada tahun 2020. Tidak ada yang pernah menyangka bahwa pertemuan itu membawa kami pada suatu ikatan yang suci. Setiap langkah yang kami ambil, setiap tawa dan air mata yang kami bagikan, seolah mengantarkan kami pada satu titik yang telah dituliskan sejak lamanya. Mungkin kami tidak selalu memahami jalan yang kami lalui, tapi kini kami yakin bahwa setiap detik telah menjadi bagian dari cerita ini.
        </p>

        {/* Bottom ink stroke */}
        <div ref={bottomStrokeRef} className="ink-stroke-line mt-8 max-w-xs mx-auto">
          <svg viewBox="0 0 300 20" className="w-full h-5" fill="none">
            <path
              d="M 295 5 Q 250 18 200 8 Q 150 -2 100 12 Q 50 22 5 5"
              stroke="var(--gold)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Subtle diary divider */}
        <p className="mt-10 text-sm tracking-[0.5em]" style={{ color: 'var(--gold)', opacity: 0.4 }}>
          &bull; &bull; &bull;
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   5. DIARY STORY — One page, one story, written in ink
   A single diary card pinned on screen.
   Each paragraph writes in with handwriting reveal,
   then dissolves like disappearing ink before the next.
   The year badge stays fixed at top-left like a diary date.
   ═══════════════════════════════════════════════════════════ */
function DiaryStorySection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const yearBadgeRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const currentIndexRef = useRef(-1)
  const hasEnteredRef = useRef(false)
  const isTransitioningRef = useRef(false)
  const sequenceCompleteRef = useRef(false)
  const pinTriggerRef = useRef<ScrollTrigger | null>(null)

  // Detect mobile for performance-tuned animation
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // ═══════════════════════════════════════════════════════════
  // HYBRID TIMING: Time-based story progression
  // ScrollTrigger ONLY pins the section and detects enter/leave
  // Story progression is driven by animation completion, NOT scroll position
  // This eliminates the dead space between stories
  // ═══════════════════════════════════════════════════════════

  // Handwriting reveal — SLOW, EMOTIONAL, CINEMATIC
  // Like someone writing memories slowly in a journal
  // Each character breathes into existence with emotional pacing
  // Word boundaries get extra pause — the pen lifts between words
  // Sentence boundaries get breathing space — the writer pauses, thinks, continues
  const doHandwritingReveal = (el: HTMLDivElement, text: string, stagger: number = 0.05, charDuration: number = 0.18, delay: number = 0) => {
    if (!el) return 0
    el.innerHTML = ''

    const allChars: HTMLSpanElement[] = []
    const wordBoundaries: number[] = [] // indices where new words start
    const sentenceBoundaryIndices: number[] = [] // indices after sentence-ending chars
    const words = text.split(' ')
    words.forEach((word, wi) => {
      const ws = document.createElement('span')
      ws.style.cssText = 'white-space:nowrap;display:inline;'
      if (wi > 0) wordBoundaries.push(allChars.length) // mark where this word starts
      for (let j = 0; j < word.length; j++) {
        const cs = document.createElement('span')
        cs.className = 'hw-char'
        // Mobile: no will-change to reduce compositing, simpler initial transform
        cs.style.cssText = isMobile
          ? `display:inline-block;opacity:0;transform:translateY(2px);min-width:0.08em;font-family:var(--font-serif);font-style:italic;`
          : `display:inline-block;will-change:opacity,transform;opacity:0;transform:translateY(3px) rotate(-1deg);min-width:0.08em;font-family:var(--font-serif);font-style:italic;`
        cs.textContent = word[j]
        ws.appendChild(cs)
        allChars.push(cs)
        // Detect sentence endings — comma, period, etc — for breathing pauses
        const ch = word[j]
        if (ch === '.' || ch === ',' || ch === '...' || ch === ';') {
          sentenceBoundaryIndices.push(allChars.length - 1)
        }
      }
      el.appendChild(ws)
      if (wi < words.length - 1) {
        const sp = document.createElement('span')
        sp.innerHTML = '\u00A0'
        sp.style.display = 'inline'
        el.appendChild(sp)
      }
    })

    // Build stagger array with word-boundary pauses AND sentence breathing pauses
    const staggerValues: number[] = allChars.map((_, i) => {
      const isWordStart = wordBoundaries.includes(i)
      const isAfterSentence = sentenceBoundaryIndices.includes(i)
      if (isAfterSentence) {
        const prevChar = i > 0 ? allChars[i - 1]?.textContent : ''
        return prevChar === '.' ? stagger * 5 : stagger * 3
      }
      return isWordStart ? stagger * 2.2 : stagger
    })

    // Convert to cumulative delay array for gsap
    let cumulativeDelay = delay
    const delays: number[] = []
    for (let i = 0; i < allChars.length; i++) {
      delays.push(cumulativeDelay)
      cumulativeDelay += staggerValues[i] + charDuration * 0.25
    }

    // Animate each character individually with its own timing
    allChars.forEach((ch, i) => {
      gsap.to(ch, {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: charDuration,
        ease: 'power2.out',
        delay: delays[i],
      })
    })

    // Return total duration so we can schedule the next story
    return cumulativeDelay + charDuration
  }

  useEffect(() => {
    if (!sectionRef.current) return

    const section = sectionRef.current
    const progressBar = progressRef.current
    const yearBadge = yearBadgeRef.current
    const titleEl = titleRef.current
    const descEl = descriptionRef.current
    const card = cardRef.current

    if (!titleEl || !descEl || !yearBadge || !card) return

    // Set initial states
    if (progressBar) gsap.set(progressBar, { scaleX: 0, transformOrigin: 'left center' })

    const totalItems = getWeddingData().timeline.length

    // ─── Calculate total handwriting duration for a text ───
    // Used to predict when handwriting finishes so we can schedule transitions
    const calcWriteDuration = (text: string, stagger: number, charDuration: number, delay: number = 0) => {
      // Rough approximation matching doHandwritingReveal's timing logic
      // Count word boundaries and sentence boundaries for realistic estimate
      const words = text.split(' ')
      let totalStagger = 0
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        const prevCh = i > 0 ? text[i - 1] : ''
        if (prevCh === '.') totalStagger += stagger * 5
        else if (prevCh === ',' || prevCh === ';') totalStagger += stagger * 3
        else if (ch === ' ') totalStagger += stagger * 2.2
        else totalStagger += stagger
      }
      return delay + totalStagger + text.length * (charDuration * 0.25) + charDuration
    }

    // ─── Show story item with handwriting reveal ───
    // Returns the total duration from start until description handwriting completes
    const showStoryItem = (index: number): number => {
      const item = getWeddingData().timeline[index]
      if (!item) return 0

      // Update year badge
      if (yearBadge) {
        yearBadge.textContent = item.year
        gsap.fromTo(yearBadge, { opacity: 0, y: isMobile ? -3 : -5 }, { opacity: 0.6, y: 0, duration: 0.4, ease: 'power2.out' })
      }

      // Title handwriting
      const titleStagger = isMobile ? 0.05 : 0.07
      const titleCharDur = isMobile ? 0.14 : 0.2
      const titleWriteTime = doHandwritingReveal(titleEl, item.title, titleStagger, titleCharDur)
        || calcWriteDuration(item.title, titleStagger, titleCharDur)

      // Description handwriting — starts after title + breathing pause
      const descStagger = isMobile ? 0.035 : 0.05
      const descCharDur = isMobile ? 0.1 : 0.16
      const breathingPause = isMobile ? 0.8 : 1.2
      const descDelay = titleWriteTime + breathingPause
      const descWriteTime = doHandwritingReveal(descEl, item.description, descStagger, descCharDur, descDelay)
        || calcWriteDuration(item.description, descStagger, descCharDur, descDelay)

      // Total duration: from start of this story until description finishes writing
      return descWriteTime
    }

    // ─── Ink dissolve transition ───
    // Returns a Promise that resolves when dissolve is complete
    const inkDissolve = (): Promise<void> => {
      return new Promise((resolve) => {
        gsap.killTweensOf([titleEl, descEl, yearBadge])

        const tl = gsap.timeline({ onComplete: resolve })

        // Ink dissolve — text fades like disappearing ink on old paper
        tl.to([titleEl, descEl], {
          opacity: 0,
          ...(isMobile ? {} : { filter: 'blur(2px)' }),
          duration: isMobile ? 0.6 : 0.8,
          ease: 'power2.inOut',
          stagger: 0.05,
        })

        // Year badge fades softly
        if (yearBadge) {
          tl.to(yearBadge, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
          }, '-=0.5')
        }
      })
    }

    // ─── TIME-BASED STORY SEQUENCE ───
    // Each story starts based on when the previous one FINISHES
    // No dead space — the emotional rhythm is controlled by timing, not scroll
    const runStorySequence = async () => {
      for (let i = 0; i < totalItems; i++) {
        // Update progress bar
        const progress = (i + 0.5) / totalItems
        if (progressBar) {
          gsap.to(progressBar, { scaleX: progress, duration: 0.4, ease: 'power2.out' })
        }

        // Show this story — returns duration of handwriting
        currentIndexRef.current = i
        const writeDuration = showStoryItem(i)

        // Wait for handwriting to complete
        await new Promise<void>((resolve) => {
          setTimeout(resolve, writeDuration * 1000)
        })

        // After handwriting completes, hold briefly — let the reader absorb
        // Max 1.2s hold — keeps momentum, no dead space
        const holdTime = isMobile ? 0.9 : 1.2
        await new Promise<void>((resolve) => {
          setTimeout(resolve, holdTime * 1000)
        })

        // If this is the last story, skip dissolve — we'll do a final hold
        if (i === totalItems - 1) break

        // Ink dissolve 0.6–0.8s
        await inkDissolve()

        // Clear and reset for next story — minimal gap
        titleEl.innerHTML = ''
        descEl.innerHTML = ''
        gsap.set([titleEl, descEl], { opacity: 1, filter: 'blur(0px)' })
      }

      // ─── Final story complete ───
      // Update progress bar to full
      if (progressBar) {
        gsap.to(progressBar, { scaleX: 1, duration: 0.4, ease: 'power2.out' })
      }

      // Hold 1.5s max on final story — let the last words sink in
      await new Promise<void>((resolve) => {
        setTimeout(resolve, isMobile ? 1200 : 1500)
      })

      // Mark sequence as complete — signal auto-scroll to resume
      sequenceCompleteRef.current = true

      // Signal that diary section is done — auto-scroll can resume
      // Dispatch FIRST before killing the pin, so auto-scroll starts
      // accumulating again and is ready to scroll when pin space vanishes
      window.dispatchEvent(new CustomEvent('diary-sequence-complete'))

      // Wait a beat for auto-scroll to resume, THEN kill pin
      // This way the page can smoothly scroll past the diary section
      // instead of experiencing a sudden layout shift
      setTimeout(() => {
        if (pinTriggerRef.current) {
          pinTriggerRef.current.kill()
          pinTriggerRef.current = null
          // Refresh all ScrollTriggers to recalculate positions after pin removal
          ScrollTrigger.refresh()
        }
      }, 200)
    }

    // ─── IntersectionObserver: detect entry ───
    // When the diary section enters the viewport, start the time-based sequence
    const enterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEnteredRef.current) {
            hasEnteredRef.current = true

            gsap.to(section, { opacity: 1, duration: 0.5, ease: 'power2.out' })
            gsap.to(card, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1,
              onComplete: () => {
                // Start the time-based story sequence
                runStorySequence()
              }
            })
            enterObserver.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )
    enterObserver.observe(section)

    // ─── ScrollTrigger: PAUSE auto-scroll at top 0% ───
    // When the diary section's top reaches the top of viewport (top 0%),
    // dispatch diary-sequence-start to pause auto-scroll
    ScrollTrigger.create({
      trigger: section,
      start: 'top 0%',
      onEnter: () => {
        if (!sequenceCompleteRef.current) {
          window.dispatchEvent(new CustomEvent('diary-sequence-start'))
        }
      },
    })

    // ─── ScrollTrigger: PIN ONLY, no story progression logic ───
    // Pin the section while the time-based sequence plays
    // Calculate a reasonable pin duration based on estimated total sequence time
    // Story 1 handwriting + hold + dissolve ~15-20s, similar for others
    // Total ~45-60s of pinned time
    // We use a generous scroll distance to ensure the pin doesn't end prematurely
    const estimatedDuration = isMobile ? 40 : 50 // seconds of pinned time
    // Convert seconds to scroll distance (approximate: 1s ≈ 2vh at typical scroll speed)
    const pinDistance = estimatedDuration * (isMobile ? 3 : 2.5)

    const pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 0%',
      end: `+=${pinDistance}vh`,
      pin: true,
      anticipatePin: 1,
      // NO scrub — time-based progression, not scroll-linked
      // NO onUpdate — story changes are driven by animation completion
    })
    pinTriggerRef.current = pinTrigger

    return () => {
      enterObserver.disconnect()
      if (pinTriggerRef.current) {
        pinTriggerRef.current.kill()
        pinTriggerRef.current = null
      }
    }
  }, [])

  return (
    <section ref={sectionRef} data-section="diaryStory" className="diary-paper-bg diary-lines diary-margin cinema-depth py-28 px-6 relative" style={{ opacity: 0 }}>
      {/* Warm reading-lamp glow from top-left — like a desk lamp illuminating the diary */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 15% 10%, rgba(232,200,120,0.2) 0%, rgba(201,169,110,0.06) 30%, transparent 55%)' }} />
      {/* Soft shadow on right side — the unlit part of the desk */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 60%, rgba(26,21,16,0.15) 100%)' }} />
      {/* Progress bar — thin gold line at top */}
      <div
        ref={progressRef}
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        style={{ background: 'linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-dark))', transform: 'scaleX(0)', transformOrigin: 'left center' }}
      />

      <div className="max-w-lg mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl text-center mb-12" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Waktu Kian Berlalu
        </h2>

        {/* The diary card — one page, one story */}
        <div
          ref={cardRef}
          className="diary-note-card diary-note-card-vignette relative p-8 sm:p-10 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden"
          style={{ minHeight: '340px', opacity: 0, transform: 'translateY(15px)' }}
        >
          {/* Year + Title — side by side like a diary date heading */}
          <div className="flex items-baseline gap-3 mb-4 min-h-[2em]">
            <div
              ref={yearBadgeRef}
              className="text-sm tracking-wider shrink-0"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--gold)', opacity: 0 }}
            >
              {getWeddingData().timeline[0]?.year}
            </div>
            <div
              ref={titleRef}
              className="text-2xl sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', fontStyle: 'italic' }}
            />
          </div>

          {/* Description — serif italic, handwriting reveal */}
          <div
            ref={descriptionRef}
            className="text-base sm:text-lg leading-relaxed min-h-[6em]"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)', fontStyle: 'italic' }}
          />

          {/* Subtle bottom margin line */}
          <div className="absolute bottom-6 left-8 right-8 h-[1px]" style={{ background: 'var(--gold)', opacity: 0.1 }} />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   6. COUNTDOWN — Waiting Together
   Every second brings us closer
   ═══════════════════════════════════════════════════════════ */
function CountdownSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { days, hours, minutes, seconds } = useCountdown(getWeddingData().akadDate)

  useEffect(() => {
    const ctx = gsap.context(() => {
      fadeIn(sectionRef.current!, { duration: 1.2, y: 20 })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} data-section="countdown" className="batik-kawung cinema-depth py-28 px-6 text-center relative" style={{ opacity: 0, color: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto relative z-10">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: '#E8D5A3' }}>
          Menghitung Hari
        </h2>
        <div className="ornament-divider ornament-divider-light max-w-xs mx-auto mb-14">
          <span className="text-lg" style={{ color: '#E8D5A3' }}>&#10047;</span>
        </div>

        {/* Countdown numbers */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8">
          {[
            { value: days, label: 'Hari' },
            { value: hours, label: 'Jam' },
            { value: minutes, label: 'Menit' },
            { value: seconds, label: 'Detik' },
          ].map((item, i) => (
            <div key={item.label} className="text-center">
              <div
                className="countdown-number text-4xl sm:text-6xl"
                style={{
                  fontFamily: 'var(--font-serif)',
                  color: '#F0DFA0',
                  textShadow: '0 0 20px rgba(201,169,110,0.4), 0 0 40px rgba(201,169,110,0.15)',
                  animation: i === 0 ? 'breathe 4s ease-in-out infinite' : undefined,
                }}
              >
                {String(item.value).padStart(2, '0')}
              </div>
              <p
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase mt-2"
                style={{ fontFamily: 'var(--font-body)', color: '#D4B87A' }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: '#D4B87A' }}>
          menuju hari bahagia kami
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   7. EVENT — The Details
   Simple, clean, no flip animation
   ═══════════════════════════════════════════════════════════ */
function EventSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const akadRef = useRef<HTMLDivElement>(null)
  const resepsiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      fadeIn(sectionRef.current!, { duration: 1.2, y: 20 })

      if (akadRef.current) {
        gsap.fromTo(akadRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 65%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      if (resepsiRef.current) {
        gsap.fromTo(resepsiRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            delay: 0.4,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 65%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    })

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} data-section="events" className="py-28 px-6" style={{ background: 'var(--cream-dark)', opacity: 0 }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Acara
        </h2>
        <div className="ornament-divider max-w-xs mx-auto mb-14">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Akad Nikah */}
          <div
            ref={akadRef}
            className="diary-note-card p-6 sm:p-8 rounded-lg text-center"
            style={{ opacity: 0 }}
          >
            <h3
              className="text-lg sm:text-xl tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)' }}
            >
              Akad Nikah
            </h3>
            <div className="ornament-divider max-w-[100px] mx-auto mb-4">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
              05 Juli 2026
            </p>
            <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}>
              10:00 WIB
            </p>
          </div>

          {/* Resepsi */}
          <div
            ref={resepsiRef}
            className="diary-note-card p-6 sm:p-8 rounded-lg text-center"
            style={{ opacity: 0 }}
          >
            <h3
              className="text-lg sm:text-xl tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)' }}
            >
              Resepsi
            </h3>
            <div className="ornament-divider max-w-[100px] mx-auto mb-4">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
              05 Juli 2026
            </p>
            <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}>
              11:00 - 17:00 WIB
            </p>
          </div>
        </div>

        {/* Venue & Address */}
        <div className="mt-10">
          <p className="text-base font-medium mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown)' }}>
            {getWeddingData().venue}
          </p>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
            {getWeddingData().address}
          </p>
        </div>

        {/* QR Code for Maps location */}
        <div className="mt-8 max-w-[200px] mx-auto">
          <div className="w-full aspect-square">
            <img
              src="/images/maps-qrcode.png"
              alt="QR Code Lokasi Acara"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          <a
            href="https://maps.app.goo.gl/JJ1Lmg33ensJgAvEA?g_st=ac"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full mt-3 px-6 py-2.5 border border-[var(--gold)]/60 text-[var(--gold-dark)] tracking-[0.15em] uppercase text-[10px] sm:text-xs hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/80 transition-all duration-500 rounded-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            Lihat Google Maps
          </a>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   8. GALLERY — Memories Returning
   Like memories surfacing one by one from a dream.
   Each photo drifts in from depth — not displayed, but remembered.
   Organic spacing, cinematic zoom, layered depth, subtle float.
   ═══════════════════════════════════════════════════════════ */
function GallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const bgTextRef = useRef<HTMLDivElement>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Detect mobile once
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Organic rotations — slightly different each time, like scattered photos on a table
  const rotations = useRef(
    getWeddingData().galleryImages.map(() => Math.round((Math.random() - 0.5) * 12))
  )

  // Organic depth offsets — memories overlap and layer like a dream collage
  // Featured photos are closer (bigger scale), background memories are further
  const depthOffsets = useRef(
    getWeddingData().galleryImages.map((_, i) => {
      // Featured memories (every 4th) — closer, bigger, more vivid
      const isFeatured = i % 4 === 0
      return {
        x: (Math.random() - 0.5) * (isFeatured ? 8 : 16),
        y: (Math.random() - 0.5) * (isFeatured ? 6 : 12),
        scale: isFeatured ? 0.95 + Math.random() * 0.05 : 0.82 + Math.random() * 0.1,
        z: isFeatured ? 10 + i : i,
        opacity: isFeatured ? 1 : 0.85 + Math.random() * 0.15,
      }
    })
  )

  // Varied sizes — memories are not all the same size, some are closer, some further
  const photoSizes = useRef(
    getWeddingData().galleryImages.map((_, i) => {
      if (i === 0) return 300 // First memory — biggest, most vivid
      if (i % 4 === 0) return 260 // Featured memories — prominent
      if (i % 3 === 0) return 220 // Medium memories
      if (i % 2 === 0) return 180 // Smaller memories
      return 150 + Math.round(Math.random() * 30) // Background memories
    })
  )

  // Organic vertical offsets — some memories are slightly higher or lower
  // Like photos scattered on a table, not perfectly aligned
  const verticalOffsets = useRef(
    getWeddingData().galleryImages.map((_, i) => {
      if (i === 0) return 0 // First memory: center anchor
      return (Math.random() - 0.5) * 30
    })
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current!
      fadeIn(section, { duration: 1.2, y: 20 })

      // ─── Background handwriting silhouette ───
      // Quran verse / hadith about love & marriage flowing as faint handwritten text
      // Silhouette effect — very low opacity, large italic font, scrolls through
      if (bgTextRef.current) {
        const bgEl = bgTextRef.current
        // Set initial: text starts below viewport, will scroll up through the section
        gsap.set(bgEl, { y: '30%' })

        // Animate the text flowing upward as user scrolls / auto-scroll
        gsap.to(bgEl, {
          y: '-80%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        })

        // Fade in the silhouette when section enters
        gsap.fromTo(bgEl,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // ─── Title & ornament entrance ───
      const titleEl = section.querySelector('.gallery-title')
      const ornamentEl = section.querySelector('.gallery-ornament')
      if (titleEl) {
        gsap.fromTo(titleEl,
          { opacity: 0, y: 30, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 30%', toggleActions: 'play none none none' }
          }
        )
      }
      if (ornamentEl) {
        gsap.fromTo(ornamentEl,
          { opacity: 0, scale: 0.5 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(2)', delay: 0.3,
            scrollTrigger: { trigger: section, start: 'top 30%', toggleActions: 'play none none none' }
          }
        )
      }

      // ─── Photos reveal — staggered with blur-to-clear + Ken Burns ───
      // Enhanced: 0.15s stagger, blur-to-clear, then Ken Burns slow zoom+pan
      const memories = section.querySelectorAll('.memory-photo')
      if (memories.length > 0) {
        // Set all photos to base opacity immediately so they're never invisible
        memories.forEach((memory) => {
          gsap.set(memory, { opacity: 0.15, filter: 'blur(6px) brightness(0.6)' })
        })

        memories.forEach((memory, i) => {
          const depth = depthOffsets.current[i]
          const isFeatured = i % 4 === 0

          // Staggered reveal — 0.15s stagger for cinematic cascade
          const staggerDelay = isMobile ? 0.1 * i : 0.15 * i

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 30%',
              toggleActions: 'play none none none',
            },
            delay: staggerDelay,
          })

          // Phase 1: Emerge — from faint/blurry to mostly visible
          tl.to(memory, {
            opacity: depth.opacity * 0.85,
            x: depth.x,
            y: (verticalOffsets.current[i] || 0) + depth.y,
            rotation: rotations.current[i],
            filter: 'blur(2px) brightness(0.9)',
            duration: isMobile ? 0.4 : 0.5,
            ease: 'power2.out',
          })

          // Phase 2: Focus — fully clear
          tl.to(memory, {
            opacity: depth.opacity,
            filter: 'blur(0px) brightness(1)',
            duration: isMobile ? 0.25 : 0.35,
            ease: 'power2.out',
          })

          // Phase 3: Ken Burns — slow zoom + pan on the inner <img>
          tl.call(() => {
            const imgEl = memory.querySelector('img')
            if (imgEl) {
              gsap.fromTo(imgEl,
                { scale: 1, x: 0, y: 0 },
                { scale: 1.06, x: '-1%', y: '-0.5%', duration: 10, ease: 'none' }
              )
            }

            // Breathing float — the memory is alive, gently drifting
            const floatDistance = isFeatured ? 3.5 : 2
            const floatDuration = isFeatured ? 4.5 : 3 + Math.random() * 2.5
            const floatX = (Math.random() - 0.5) * 2
            gsap.to(memory, {
              y: `+=${floatDistance}`,
              x: `+=${floatX}`,
              duration: floatDuration,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
              delay: Math.random() * 2,
            })
          })
        })

        // ─── Section-level golden light wash ───
        // A warm glow pulses through the entire gallery after all photos settle
        const lightWash = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 30%',
            toggleActions: 'play none none none',
          },
          delay: memories.length * (isMobile ? 0.15 : 0.22) + 1.5,
        })
        lightWash.fromTo(section,
          { filter: 'brightness(1)' },
          { filter: 'brightness(1.08)', duration: 0.8, ease: 'power2.inOut', yoyo: true, repeat: 1 }
        )
      }
    })
    return () => ctx.revert()
  }, [])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => prev !== null ? (prev - 1 + getWeddingData().galleryImages.length) % getWeddingData().galleryImages.length : null)
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => prev !== null ? (prev + 1) % getWeddingData().galleryImages.length : null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex])

  // Touch swipe for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = e.changedTouches[0].clientX - touchStart
    if (Math.abs(diff) > 50) {
      if (diff > 0 && lightboxIndex !== null) {
        setLightboxIndex((lightboxIndex - 1 + getWeddingData().galleryImages.length) % getWeddingData().galleryImages.length)
      } else if (diff < 0 && lightboxIndex !== null) {
        setLightboxIndex((lightboxIndex + 1) % getWeddingData().galleryImages.length)
      }
    }
    setTouchStart(null)
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + getWeddingData().galleryImages.length) % getWeddingData().galleryImages.length)
    }
  }
  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % getWeddingData().galleryImages.length)
    }
  }

  return (
    <section ref={sectionRef} data-section="gallery" className="diary-paper-bg cinema-depth py-28 px-6 relative overflow-hidden" style={{ opacity: 0 }}>
      {/* Dark vignette overlay — focus attention on photos like a gallery spotlight */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(26,21,16,0.5) 100%)', zIndex: 2 }} />
      {/* Background handwriting silhouette — Quran verse about love flowing behind photos */}
      <div
        ref={bgTextRef}
        className="absolute inset-0 pointer-events-none select-none"
        style={{ zIndex: 0 }}
      >
        {/* Repeated text blocks covering full section height so silhouette is always visible */}
        {[0, 1, 2, 3].map((block) => (
          <div
            key={block}
            className="flex items-center justify-center"
            style={{
              position: 'absolute',
              top: `${block * 30}%`,
              left: 0,
              right: 0,
              height: '35%',
            }}
          >
            <p
              className="whitespace-pre-line text-center leading-loose"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 'clamp(1.2rem, 3vw, 2.2rem)',
                color: 'var(--gold)',
                opacity: block % 2 === 0 ? 0.18 : 0.10,
                maxWidth: '90%',
              }}
            >
              {block === 0 && 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.\n\n— QS. Ar-Rum: 21'}
              {block === 1 && 'Pernikahan adalah separuh agama, maka barangsiapa menikah maka ia telah menyempurnakan separuh agamanya, maka bertaqwalah kepada Allah pada separuh yang lainnya.\n\n— HR. Al-Baihaqi'}
              {block === 2 && 'Sebaik-baik di antara kalian adalah yang paling baik kepada istrinya.\n\n— HR. Tirmidzi'}
              {block === 3 && 'Dan Allah menjadikan bagi kamu pasangan dari jenis kamu sendiri dan menjadikan anak dan cucu dari pasanganmu.\n\n— QS. An-Nahl: 72'}
            </p>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="gallery-title text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Momen Kami
        </h2>
        <div className="gallery-ornament ornament-divider max-w-xs mx-auto mb-14">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>

        {/* Memories returning one by one — like photos surfacing from a dream */}
        <div className="gallery-memories">
          {getWeddingData().galleryImages.map((img, index) => {
            const depth = depthOffsets.current[index]
            const isFeatured = index % 4 === 0
            const verticalOffset = verticalOffsets.current[index] || 0
            return (
            <div
              key={index}
              className="memory-photo cursor-pointer"
              style={{
                // Organic placement — each photo drifts to its own position
                transform: `rotate(${rotations.current[index]}deg)`,
                maxWidth: `${photoSizes.current[index]}px`,
                // Layered depth — organic horizontal offset, not rigid grid
                marginLeft: index % 3 === 0 ? 'auto' : index % 3 === 1 ? '5%' : '2%',
                marginRight: index % 3 === 0 ? '2%' : index % 3 === 1 ? 'auto' : '5%',
                // Organic vertical spacing — deeper overlap for layered memory feel
                marginBottom: isFeatured ? '-12px' : index % 2 === 0 ? '-20px' : '-10px',
                marginTop: `${verticalOffset}px`,
                // Layered z-index for overlap depth feel — featured on top
                zIndex: depth.z,
                position: 'relative',
                // Featured memories get slightly more prominent shadow
              }}
              onClick={() => openLightbox(index)}
              role="button"
              tabIndex={0}
              aria-label={`Lihat foto ${getWeddingData().galleryCaptions[index]}`}
              onKeyDown={(e) => { if (e.key === 'Enter') openLightbox(index) }}
            >
              <div className="aspect-[4/5] overflow-hidden bg-[var(--cream-dark)]">
                <img
                  src={img}
                  alt={getWeddingData().galleryCaptions[index]}
                  className="w-full h-full object-cover will-change-transform"
                  loading="lazy"
                />
              </div>
              <p
                className="text-center text-xs sm:text-sm italic mt-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}
              >
                {getWeddingData().galleryCaptions[index]}
              </p>
            </div>
            )
          })}
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-label="Gallery lightbox"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
            onClick={closeLightbox}
            aria-label="Tutup"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev arrow */}
          <button
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors z-10 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            aria-label="Sebelumnya"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next arrow */}
          <button
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors z-10 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            aria-label="Selanjutnya"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="max-w-4xl max-h-[85vh] px-14 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getWeddingData().galleryImages[lightboxIndex]}
              alt={getWeddingData().galleryCaptions[lightboxIndex]}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            <p
              className="text-center text-sm italic mt-4"
              style={{ fontFamily: 'var(--font-serif)', color: 'rgba(255,255,255,0.6)' }}
            >
              {getWeddingData().galleryCaptions[lightboxIndex]}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   9. CLOSING — The Last Page
   "Cerita yang tertulis, lalu menguap menjadi debu"

   Phase 1: HANDWRITING — text writes itself in, character by character
            Like the diary story, ink flowing onto the page
            Exception: Arabic بارك الله لكما appears immediately (no animation)

   Phase 2: DUST DISSOLVE — after all text is written,
            words dissolve from back to front like dust in the wind
            The story evaporates, leaving only the doa and the date
            Like the ending of a film — the image fades, the feeling remains

   Font: Cormorant Garamond for all white text, Amiri for Arabic, Inter for transliteration
   ═══════════════════════════════════════════════════════════ */

function ClosingSection({ onGoToInfo }: { onGoToInfo?: () => void }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const transRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const finalRef = useRef<HTMLDivElement>(null)
  const arabicRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    // ─── CLOSING HANDWRITING REVEAL ───
    // Same proven approach as DiaryStory — character by character
    // Returns total duration for scheduling
    const closingHandwriting = (
      el: HTMLDivElement | null,
      stagger: number = 0.03,
      charDuration: number = 0.1,
      delay: number = 0,
    ): number => {
      if (!el) return delay
      const fullText = el.textContent || ''
      if (!fullText.trim()) return delay

      // Prevent React reconciliation from wiping out our DOM changes
      // by creating a detached fragment and replacing all children at once
      const fragment = document.createDocumentFragment()
      const allChars: HTMLSpanElement[] = []
      const words = fullText.split(' ')

      words.forEach((word, wi) => {
        const ws = document.createElement('span')
        ws.style.cssText = 'white-space:nowrap;display:inline;'
        for (let j = 0; j < word.length; j++) {
          const cs = document.createElement('span')
          cs.className = 'hw-char'
          cs.style.cssText = 'display:inline-block;will-change:opacity,transform;opacity:0;transform:translateY(3px) rotate(-1deg);min-width:0.05em;'
          cs.textContent = word[j]
          ws.appendChild(cs)
          allChars.push(cs)
        }
        fragment.appendChild(ws)
        if (wi < words.length - 1) {
          const sp = document.createElement('span')
          sp.innerHTML = '\u00A0'
          sp.style.display = 'inline'
          fragment.appendChild(sp)
        }
      })

      // Replace content in one operation to minimize React conflicts
      el.innerHTML = ''
      el.appendChild(fragment)

      gsap.to(allChars, {
        opacity: 1,
        y: 0,
        rotation: 0,
        duration: charDuration,
        stagger,
        ease: 'power2.out',
        delay,
      })

      return delay + allChars.length * stagger + charDuration
    }

    // ─── DUST DISSOLVE ───
    // Words disintegrate like dust from back to front
    // Last word disappears first, spreading upward like ash
    // This is the ending: the story evaporates
    const dustDissolve = (el: HTMLDivElement | null, delay: number = 0): number => {
      if (!el) return delay
      // Collect all word containers (the nowrap spans created by handwriting)
      const wordSpans = el.querySelectorAll<HTMLElement>('span[style*="nowrap"]')
      if (wordSpans.length === 0) return delay

      // Reverse order — last word dissolves first
      const reversed = Array.from(wordSpans).reverse()

      const tl = gsap.timeline({ delay })

      reversed.forEach((ws, i) => {
        // Each word: blur + scale up + float away + fade
        // Like dust particles catching light and dispersing
        tl.to(ws, {
          opacity: 0,
          scale: 1.15,
          y: -(8 + Math.random() * 15),
          rotation: (Math.random() - 0.5) * 6,
          filter: 'blur(3px)',
          duration: 0.7,
          ease: 'power2.in',
        }, i * 0.08)
      })

      return delay + reversed.length * 0.08 + 0.7
    }

    // IntersectionObserver: trigger animation at 30% visible (handwriting starts early)
    // ScrollTrigger (separate): pause auto-scroll when section top reaches viewport top (0%)
    // This way animation plays while auto-scroll still moves, scroll pauses at top 0%
    const closingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true
            closingObserver.disconnect()

            // DO NOT dispatch closing-sequence-start here!
            // Auto-scroll pause is handled by ScrollTrigger at top 0%

            // Fade section in
            gsap.to(section, { opacity: 1, duration: 1, ease: 'power2.out' })

            // ═══ PHASE 1: HANDWRITING ═══
            // Make text containers visible (they start at opacity:0 to prevent text flash)
            if (titleRef.current) gsap.set(titleRef.current, { opacity: 1 })
            const titleEnd = closingHandwriting(titleRef.current, 0.035, 0.1, 0.3)
            if (subtitleRef.current) gsap.set(subtitleRef.current, { opacity: 1 })
            const subtitleEnd = closingHandwriting(subtitleRef.current, 0.03, 0.09, titleEnd + 0.5)

            // Arabic appears gently — no handwriting
            if (arabicRef.current) {
              gsap.to(arabicRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: subtitleEnd + 0.3 })
            }

            if (transRef.current) gsap.set(transRef.current, { opacity: 1 })
            const transEnd = closingHandwriting(transRef.current, 0.025, 0.08, subtitleEnd + 1.0)

            // Divider appears
            if (dividerRef.current) {
              gsap.to(dividerRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(2)', delay: transEnd + 0.3 })
            }

            if (footerRef.current) gsap.set(footerRef.current, { opacity: 1 })
            const footerEnd = closingHandwriting(footerRef.current, 0.035, 0.1, transEnd + 0.8)
            if (finalRef.current) gsap.set(finalRef.current, { opacity: 1 })
            const finalEnd = closingHandwriting(finalRef.current, 0.06, 0.15, footerEnd + 0.8)

            // ═══ PHASE 2: DUST DISSOLVE ═══
            const dustDelay = finalEnd + 2.5

            const titleDust = dustDissolve(titleRef.current, dustDelay)
            const subtitleDust = dustDissolve(subtitleRef.current, dustDelay + 0.4)
            const transDust = dustDissolve(transRef.current, dustDelay + 0.8)
            const footerDust = dustDissolve(footerRef.current, dustDelay + 1.2)
            const finalDust = dustDissolve(finalRef.current, dustDelay + 1.6)

            // Divider fades
            if (dividerRef.current) {
              gsap.to(dividerRef.current, { opacity: 0, duration: 0.8, ease: 'power2.in', delay: dustDelay + 1.0 })
            }

            // ═══ AFTER DUST: Only the doa remains ═══
            const afterDust = Math.max(titleDust, subtitleDust, transDust, footerDust, finalDust) + 1.0

            if (dateRef.current) {
              gsap.to(dateRef.current, { opacity: 1, duration: 2, ease: 'power2.out', delay: afterDust,
                onComplete: () => {
                  // Resume auto-scroll after closing animation is fully done
                  window.dispatchEvent(new CustomEvent('closing-sequence-complete'))

                  // CTA button fade-in after credit appears
                  if (ctaRef.current && onGoToInfo) {
                    gsap.to(ctaRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 0.5 })
                  }
                }
              })
            } else {
              // No credit element — just resume after dust settles
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('closing-sequence-complete'))
                if (ctaRef.current && onGoToInfo) {
                  gsap.to(ctaRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' })
                }
              }, (afterDust + 2) * 1000)
            }
          }
        })
      },
      { threshold: 0.3 }
    )
    closingObserver.observe(section)

    // NOTE: Closing auto-scroll lock is now handled directly in the
    // auto-scroll tick function (see isClosingReadyToLock check).
    // This avoids ScrollTrigger miscalculating positions after diary pin removal,
    // which caused closing-sequence-start to fire too early (at envelope section).
    // Animation start (30% visible) is still handled by IntersectionObserver above.

    return () => closingObserver.disconnect()
  }, [onGoToInfo])

  return (
    <section ref={sectionRef} data-section="closing" className="batik-kawung-dark cinema-vignette cinema-bloom cinema-dust diary-page-close relative py-28 px-6 text-center overflow-hidden" style={{ opacity: 0 }}>
      {/* Gold light leak */}
      <div className="gold-light-leak absolute inset-0 pointer-events-none" />

      {/* Final petals — the last visible movement before silence */}
      {/* DriedLeaves component handles the convergence animation automatically */}

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Title — handwriting reveal, then dust dissolve */}
        <div ref={titleRef} className="text-lg sm:text-xl leading-relaxed mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', fontStyle: 'italic', opacity: 0 }}>
          Dan seperti semua cerita indah yang dituliskan semesta, kisah kami baru saja dimulai.
        </div>

        {/* Subtitle — handwriting, then dust */}
        <div ref={subtitleRef} className="text-sm sm:text-base leading-relaxed mb-10" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', opacity: 0, fontStyle: 'italic' }}>
          Terima kasih telah menjadi bagian dari perjalanan kecil kami menuju selamanya.
        </div>

        {/* Doa — Arabic appears immediately (no handwriting), transliteration gets handwriting */}
        <div className="mb-8">
          <p
            ref={arabicRef}
            className="text-base sm:text-lg leading-relaxed mb-4"
            style={{ fontFamily: 'Amiri, serif', color: 'var(--gold-light)', opacity: 0 }}
            dir="rtl"
          >
            بارك الله لكما وبارك عليكما وجمع بينكما في خير
          </p>
          <div ref={transRef} className="text-xs italic" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gold)', opacity: 0 }}>
            Barakallahu lakuma wa baraka&lsquo;alaikuma wa jama&lsquo;a bainakuma fi khair.
          </div>
        </div>

        {/* Small divider */}
        <div ref={dividerRef} className="ornament-divider max-w-[120px] mx-auto mb-6" style={{ opacity: 0, transform: 'scale(0.5)' }}>
          <span className="text-[var(--gold)] text-xs">&#10047;</span>
        </div>

        {/* Footer line — handwriting, then dust */}
        <div ref={footerRef} className="text-sm mb-16" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', opacity: 0, fontStyle: 'italic' }}>
          Forever starts with Bismillah.
        </div>

        {/* Final emotional line — handwriting, then dust */}
        <div ref={finalRef} className="text-2xl sm:text-3xl min-h-[2em]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', fontWeight: 300, fontStyle: 'italic', opacity: 0 }}>
          Cerita kami belum selesai...
        </div>

        {/* Credit — appears after dust settles, the only thing left */}
        <div
          ref={dateRef}
          className="mt-8"
          style={{ opacity: 0, pointerEvents: 'none' }}
        >
          <p
            className="text-[10px] sm:text-xs tracking-[0.1em] leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", color: '#ffffff', opacity: 0.4 }}
          >
            Powered By Nauka Motion
          </p>
        </div>

        {/* CTA to Info Acara — appears after closing animation completes */}
        {onGoToInfo && (
          <div ref={ctaRef} className="mt-12" style={{ opacity: 0 }}>
            <button
              onClick={onGoToInfo}
              className="px-8 py-3 border border-[var(--gold)]/60 text-[var(--gold-light)] tracking-[0.3em] uppercase text-[10px] sm:text-xs hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/80 transition-all duration-700 cursor-pointer"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Lihat Info Acara
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   10. FOOTER — The End
   Very minimal, very elegant
   ═══════════════════════════════════════════════════════════ */
function FooterSection() {
  return (
    <footer data-section="footer" className="relative py-10 px-6 text-center" style={{ background: '#2C2218' }}>
      {/* Sidomukti pattern border at top */}
      <div
        className="absolute top-0 left-0 right-0 h-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Cpath d='M35 5 L45 20 L35 15 L25 20 Z' fill='none' stroke='%23C9A96E' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M35 65 L45 50 L35 55 L25 50 Z' fill='none' stroke='%23C9A96E' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M5 35 L20 25 L15 35 L20 45 Z' fill='none' stroke='%23C9A96E' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M65 35 L50 25 L55 35 L50 45 Z' fill='none' stroke='%23C9A96E' stroke-width='0.5' opacity='0.15'/%3E%3Crect x='25' y='25' width='20' height='20' transform='rotate(45 35 35)' fill='none' stroke='%23C9A96E' stroke-width='0.3' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '70px 70px',
          opacity: 0.5,
        }}
      />

      <div className="relative z-10">
        <p
          className="text-2xl sm:text-3xl mb-2"
          style={{ fontFamily: 'var(--font-script)', color: 'var(--gold)' }}
        >
          Irwan & Anira
        </p>
        <p
          className="text-sm tracking-[0.3em]"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--gold)', opacity: 0.5 }}
        >
          05 . 07 . 2026
        </p>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════
   HOME — The Main Experience
   "Jangan buat website. Buat perasaan."
   State-based view: cover → hub → story | info
   ═══════════════════════════════════════════════════════════ */
function HomeInner() {
  // Read initial view from URL query params (for direct linking)
  const searchParams = useSearchParams()
  const initialView = searchParams.get('view') as 'story' | 'info' | null
  const skipCover = initialView === 'story' || initialView === 'info'

  const [isLoading, setIsLoading] = useState(() => skipCover ? false : true)
  const [view, setView] = useState<'cover' | 'hub' | 'story' | 'info'>(() => skipCover ? initialView! : 'cover')
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const autoScrollRef = useRef(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const userScrollingRef = useRef(false)

  // Dynamic wedding data — fetched from DB, fallback to defaults
  const { data } = useWeddingConfig()

  // Keep module-level data in sync for section components
  useEffect(() => { setWeddingData(data) }, [data])

  const handlePreloaderComplete = useCallback(() => setIsLoading(false), [])

  const handleOpenStart = useCallback(() => {
    // Start music IMMEDIATELY when user taps "Buka" — don't wait for cover animation
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [])

  const handleOpen = useCallback(() => {
    setView('hub')
  }, [])

  const handleViewChoose = useCallback((newView: 'story' | 'info') => {
    window.scrollTo(0, 0)
    // Kill any existing ScrollTrigger instances
    ScrollTrigger.getAll().forEach(st => st.kill())
    setView(newView)
  }, [])

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying])

  const toggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled((prev) => {
      autoScrollRef.current = !prev
      return !prev
    })
  }, [])

  // ═══════════════════════════════════════════════════════════
  // AUTO-SCROLL — Time accumulator approach
  // Only active when view === 'story'
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (view !== 'story') return

    let animationId: number
    let resumeTimeout: ReturnType<typeof setTimeout> | undefined
    let lastTime = 0

    // ─── Speed: pixels per millisecond ───
    const pxPerMs = 0.025
    const pxPerMsCountdown = pxPerMs * 2
    const pxPerMsAcara = pxPerMs * 2
    const pxPerMsRSVP = pxPerMs * 2

    // ─── Section-aware speed using getBoundingClientRect() ───
    let diaryIntroElRef: Element | null | undefined = undefined
    let countdownElRef: Element | null | undefined = undefined
    let acaraElRef: Element | null | undefined = undefined
    let galleryElRef: Element | null | undefined = undefined
    let rsvpElRef: Element | null | undefined = undefined
    let envelopeElRef: Element | null | undefined = undefined
    let closingElRef: Element | null | undefined = undefined

    const isAtDiaryIntro = (): boolean => {
      if (diaryIntroElRef === undefined) diaryIntroElRef = document.querySelector('[data-section="diaryIntro"]')
      if (!diaryIntroElRef) return false
      const rect = diaryIntroElRef.getBoundingClientRect()
      return rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.3
    }
    const isPastCountdown = (): boolean => {
      if (countdownElRef === undefined) countdownElRef = document.querySelector('[data-section="countdown"]')
      if (!countdownElRef) return false
      return countdownElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastAcara = (): boolean => {
      if (acaraElRef === undefined) acaraElRef = document.querySelector('[data-section="events"]')
      if (!acaraElRef) return false
      return acaraElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastGallery = (): boolean => {
      if (galleryElRef === undefined) galleryElRef = document.querySelector('[data-section="gallery"]')
      if (!galleryElRef) return false
      return galleryElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastRSVP = (): boolean => {
      if (rsvpElRef === undefined) rsvpElRef = document.querySelector('[data-section="rsvp"]')
      if (!rsvpElRef) return false
      return rsvpElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isClosingVisible = (): boolean => {
      if (closingElRef === undefined) closingElRef = document.querySelector('[data-section="closing"]')
      if (!closingElRef) return false
      return closingElRef.getBoundingClientRect().top <= window.innerHeight
    }

    const isClosingReadyToLock = (): boolean => {
      if (closingElRef === undefined) closingElRef = document.querySelector('[data-section="closing"]')
      if (!closingElRef) return false
      return closingElRef.getBoundingClientRect().top <= window.innerHeight * 0.15
    }

    // ─── State ───
    let cinematicLock = false
    let accumulated = 0

    // ─── rAF tick ───
    const tick = (time: number) => {
      animationId = requestAnimationFrame(tick)

      if (lastTime === 0) {
        lastTime = time
        return
      }

      const delta = Math.min(time - lastTime, 50)
      lastTime = time

      if (cinematicLock || !autoScrollRef.current) {
        accumulated = 0
        return
      }

      const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50)
      if (atBottom) {
        accumulated = 0
        return
      }

      const atDiaryIntro = isAtDiaryIntro()
      const pastCountdown = isPastCountdown()
      const pastAcara = isPastAcara()
      const pastGallery = isPastGallery()
      const pastRSVP = isPastRSVP()
      const closingVisible = isClosingVisible()
      const closingReadyToLock = isClosingReadyToLock()

      if (closingReadyToLock && !cinematicLock) {
        window.dispatchEvent(new CustomEvent('closing-sequence-start'))
      }

      let speed: number
      if (closingVisible) {
        speed = pxPerMs * 1.5
      } else if (pastRSVP) {
        speed = pxPerMsRSVP
      } else if (pastGallery) {
        speed = pxPerMs
      } else if (pastAcara) {
        speed = pxPerMsAcara
      } else if (pastCountdown) {
        speed = pxPerMsCountdown
      } else if (atDiaryIntro) {
        speed = pxPerMs * 0.8
      } else {
        speed = pxPerMs
      }
      accumulated += delta * speed

      const wholePixels = Math.floor(accumulated)
      if (wholePixels > 0) {
        accumulated -= wholePixels
        const targetY = window.scrollY + wholePixels
        window.scrollTo(0, targetY)
      }
    }

    // Start after 10 seconds — give time to read the Bismillah verse
    const startTimeout = setTimeout(() => {
      lastTime = 0
      animationId = requestAnimationFrame(tick)
    }, 10000)

    // ═══ Cinematic lock — diary AND closing ═══
    const onDiaryStart = () => { cinematicLock = true }

    const onDiaryComplete = () => {
      cinematicLock = false
      userScrollingRef.current = false
      countdownElRef = undefined
      acaraElRef = undefined
      galleryElRef = undefined
      rsvpElRef = undefined
      envelopeElRef = undefined
      closingElRef = undefined
    }

    const onClosingStart = () => { cinematicLock = true }

    const onClosingComplete = () => {
      cinematicLock = false
      userScrollingRef.current = false
    }

    window.addEventListener('diary-sequence-start', onDiaryStart)
    window.addEventListener('diary-sequence-complete', onDiaryComplete)
    window.addEventListener('closing-sequence-start', onClosingStart)
    window.addEventListener('closing-sequence-complete', onClosingComplete)

    return () => {
      clearTimeout(startTimeout)
      cancelAnimationFrame(animationId)
      clearTimeout(resumeTimeout)
      window.removeEventListener('diary-sequence-start', onDiaryStart)
      window.removeEventListener('diary-sequence-complete', onDiaryComplete)
      window.removeEventListener('closing-sequence-start', onClosingStart)
      window.removeEventListener('closing-sequence-complete', onClosingComplete)
    }
  }, [view])

  // Music fade-out during closing section — emotional synchronization
  useEffect(() => {
    if (view !== 'story' || !audioRef.current) return

    const closingSection = document.querySelector('.batik-kawung-dark.cinema-vignette')
    if (!closingSection) return

    const audio = audioRef.current
    let fadeInterval: ReturnType<typeof setInterval> | null = null
    let hasStartedFade = false
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedFade && isPlaying) {
            hasStartedFade = true
            fadeInterval = setInterval(() => {
              if (audio.volume > 0.02) {
                const reduction = audio.volume > 0.7
                  ? 0.002
                  : audio.volume > 0.5
                    ? 0.003
                    : audio.volume > 0.3
                      ? 0.005
                      : audio.volume > 0.15
                        ? 0.008
                        : 0.012
                audio.volume = Math.max(0, audio.volume - reduction)
              } else {
                audio.volume = 0
                if (fadeInterval) clearInterval(fadeInterval)
                silenceTimeout = setTimeout(() => {
                  audio.pause()
                  setIsPlaying(false)
                }, 2500)
              }
            }, 120)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(closingSection)

    return () => {
      observer.disconnect()
      if (fadeInterval) clearInterval(fadeInterval)
      if (silenceTimeout) clearTimeout(silenceTimeout)
    }
  }, [view, isPlaying])

  return (
    <>
      <audio ref={audioRef} src="/music/gamelan-bg.mp3" loop preload="auto" />

      {isLoading && view === 'cover' && (
        <Preloader
          onComplete={handlePreloaderComplete}
          groomName={getWeddingData().groom}
          brideName={getWeddingData().bride}
        />
      )}

      {/* Cover phase */}
      {view === 'cover' && !isLoading && (
        <Suspense fallback={null}>
          <CoverSectionComponent onOpen={handleOpen} onOpenStart={handleOpenStart} />
        </Suspense>
      )}

      {/* Hub phase — 2 buttons after cover animation */}
      {view === 'hub' && (
        <CoverHub onChoose={handleViewChoose} />
      )}

      {/* Story phase — cinematic experience */}
      {view === 'story' && (
      <>
        <SmoothScroll>
          <main className="relative" style={{ touchAction: 'manipulation' }}>
            <CursorFollower />
            <StoryProgress />
            <DriedLeaves />

            {/* Story sections only */}
            <BismillahSection />
            <CoupleSection />
            <DiaryIntroSection />
            <DiaryStorySection />
            <GallerySection />
            <ClosingSection onGoToInfo={() => handleViewChoose('info')} />
            <FooterSection />
          </main>

        </SmoothScroll>

        {/* Control buttons — bottom left, small and minimal, rendered via portal */}
        {typeof window !== 'undefined' && createPortal(
          <div className="fixed bottom-4 left-4 flex flex-col gap-2" style={{ zIndex: 99998 }}>
            {/* Auto-scroll toggle */}
            <button
              onClick={toggleAutoScroll}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--gold)]/60 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
              style={{
                background: autoScrollEnabled ? 'rgba(250, 245, 230, 0.9)' : 'rgba(201, 169, 110, 0.9)',
                color: autoScrollEnabled ? 'var(--gold-dark)' : '#fff',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: autoScrollEnabled ? '0 0 10px rgba(201, 169, 110, 0.2)' : '0 0 10px rgba(201, 169, 110, 0.4)',
                position: 'fixed',
                bottom: '1.5rem',
                left: '1.5rem',
                zIndex: 99998,
              }}
              title={autoScrollEnabled ? 'Matikan Auto-scroll' : 'Nyalakan Auto-scroll'}
            >
              {autoScrollEnabled ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"/>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11h-2c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z" opacity="0"/>
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Music pause/play */}
            <button
              onClick={toggleMusic}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--gold)]/60 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
              style={{
                background: isPlaying ? 'rgba(250, 245, 230, 0.9)' : 'rgba(201, 169, 110, 0.9)',
                color: isPlaying ? 'var(--gold-dark)' : '#fff',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: isPlaying ? '0 0 10px rgba(201, 169, 110, 0.2)' : '0 0 10px rgba(201, 169, 110, 0.4)',
                position: 'fixed',
                bottom: '4.5rem',
                left: '1.5rem',
                zIndex: 99998,
              }}
              title={isPlaying ? 'Pause Musik' : 'Putar Musik'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </div>,
          document.body
        )}
      </>
      )}

      {/* Info phase — practical information */}
      {view === 'info' && (
      <>
        <main className="relative" style={{ touchAction: 'manipulation' }}>
          {/* Subtle link to story */}
          <div className="text-center py-8 px-6" style={{ background: 'var(--cream-dark)' }}>
            <button
              onClick={() => handleViewChoose('story')}
              className="text-sm tracking-[0.2em] uppercase cursor-pointer hover:opacity-80 transition-opacity duration-300"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--gold)', opacity: 0.6 }}
            >
              <span className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                Baca Cerita Kami
              </span>
            </button>
          </div>

          {/* Info sections */}
          <CountdownSection />
          <EventSection />
          <RSVPSection />
          <DigitalEnvelope />
          <GuestWishes />
          <FooterSection />
        </main>

        {/* Music control for info view */}
        {typeof window !== 'undefined' && createPortal(
          <button
            onClick={toggleMusic}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[var(--gold)]/60 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110"
            style={{
              background: isPlaying ? 'rgba(250, 245, 230, 0.9)' : 'rgba(201, 169, 110, 0.9)',
              color: isPlaying ? 'var(--gold-dark)' : '#fff',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: isPlaying ? '0 0 10px rgba(201, 169, 110, 0.2)' : '0 0 10px rgba(201, 169, 110, 0.4)',
              position: 'fixed',
              bottom: '1.5rem',
              left: '1.5rem',
              zIndex: 99998,
            }}
            title={isPlaying ? 'Pause Musik' : 'Putar Musik'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>,
          document.body
        )}
      </>
      )}
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
