'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import JasmineParticles from '@/components/JasmineParticles'
import Preloader from '@/components/Preloader'
import SmoothScroll from '@/components/SmoothScroll'
import CoverSectionComponent from '@/components/CoverSection'
import MusicPlayerComponent from '@/components/MusicPlayer'
import GuestWishes from '@/components/GuestWishes'
import RSVPSection from '@/components/RSVPSection'
import DigitalEnvelope from '@/components/DigitalEnvelope'
import ScrollToTop from '@/components/ScrollToTop'
import { fadeIn, slideIn, scaleIn, initCursorFollower, prefersReducedMotion } from '@/lib/animations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/* ═══════════════════════════════════════════════════════════
   WEDDING DATA
   ═══════════════════════════════════════════════════════════ */
const WEDDING = {
  groom: 'Irwan Pratomo',
  bride: 'Anira Tri Agustini',
  groomParents: 'Bpk. Sugeng Hartanto & Ibu Dahlianingsih',
  brideParents: 'Bpk Andi Yosalfi & Ibu Budi Hastuti',
  akadDate: '2026-07-05T10:00:00+07:00',
  resepsiDate: '2026-07-05T11:00:00+07:00',
  resepsiEnd: '2026-07-05T17:00:00+07:00',
  venue: 'Rumah Mempelai Wanita',
  address: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  lamaranDate: '31 Agustus 2025',
  timeline: [
    {
      year: '2022',
      title: 'Mulai Dekat',
      description:
        'Seiring berjalan waktu kami semakin dekat. Latar belakang yang berbeda membuat kami saling melengkapi dan banyak menemukan hal baru. Satu dua langkah menuntun kami hingga ke perjalanan selajutnya.',
    },
    {
      year: '2025',
      title: 'Lamaran',
      description:
        'Kehendak-Nya menuntun kami pada pertemuan yang tak pernah disangka hingga akhirnya membawa kami pada sebuah ikatan suci yang dicintai-Nya, kami melangsungkan acara lamaran pada 31 Agustus 2025.',
    },
    {
      year: '2026',
      title: 'Menikah',
      description:
        'Percayalah, bukan karena bertemu lalu berjodoh, tapi karena berjodohlah kami dipertemukan. Atas izin Allah kami memutuskan untuk mengikrarkan janji suci pernikahan pada 05 Juli 2026.',
    },
  ],
  galleryImages: [
    '/images/gallery-1.jpg', '/images/gallery-2.jpg', '/images/gallery-3.jpg',
    '/images/gallery-4.jpg', '/images/gallery-5.jpg',
  ],
  galleryCaptions: [
    'Pertama kali', 'Bersama', 'Kenangan', 'Tawa', 'Bahagia',
  ],
}

/* ═══════════════════════════════════════════════════════════
   AUTO-SCROLL NOTE:
   Speed zones (getBoundingClientRect, real-time detection):
   Normal 1x → Countdown 2x → Acara 2x → Gallery 1x → RSVP→Wishes 2x → Closing (PAUSED during animation)
   Diary & Closing get cinematic lock (full stop via custom events).
   Closing pauses auto-scroll so animation plays fully before scrolling continues.
   Auto-scroll starts 10 seconds after cover opens.
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   COUNTDOWN HOOK
   ═══════════════════════════════════════════════════════════ */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const target = new Date(targetDate).getTime()
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(interval)
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

/* ═══════════════════════════════════════════════════════════
   HANDWRITING REVEAL — shared utility
   Ink flowing onto paper, character by character
   FIXED: Faster stagger 0.022, charDuration 0.08
   ═══════════════════════════════════════════════════════════ */
function handwritingReveal(
  el: HTMLDivElement,
  stagger: number = 0.022,
  charDuration: number = 0.08,
  delay: number = 0,
) {
  if (!el) return
  const fullText = el.textContent || ''
  el.innerHTML = ''

  const allChars: HTMLSpanElement[] = []
  const words = fullText.split(' ')
  words.forEach((word, wi) => {
    const ws = document.createElement('span')
    ws.style.cssText = 'white-space:nowrap;display:inline;'
    for (let j = 0; j < word.length; j++) {
      const cs = document.createElement('span')
      cs.className = 'hw-char'
      cs.style.cssText = 'display:inline-block;will-change:opacity,transform;opacity:0;transform:translateY(3px) rotate(-2deg);min-width:0.08em;'
      cs.textContent = word[j]
      ws.appendChild(cs)
      allChars.push(cs)
    }
    el.appendChild(ws)
    if (wi < words.length - 1) {
      const sp = document.createElement('span')
      sp.innerHTML = '\u00A0'
      sp.style.display = 'inline'
      el.appendChild(sp)
    }
  })

  gsap.to(allChars, {
    opacity: 1,
    y: 0,
    rotation: 0,
    duration: charDuration,
    stagger,
    ease: 'power2.out',
    delay,
  })
}

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
      {/* Soft golden light spots */}
      <div className="gold-light-leak absolute inset-0 pointer-events-none" />
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

      // Groom photo — cinematic reveal with blur
      if (groomRef.current) {
        gsap.fromTo(groomRef.current,
          { opacity: 0, y: 30, scale: 0.85, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      }

      // Bride photo — cinematic reveal with blur, slight delay
      if (brideRef.current) {
        gsap.fromTo(brideRef.current,
          { opacity: 0, y: 30, scale: 0.85, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.8,
            delay: 0.3,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
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
      {/* Soft golden light spots */}
      <div className="gold-light-leak absolute inset-0 pointer-events-none" />

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
              <img src="/images/groom.jpg" alt={WEDDING.groom} className="w-full h-full object-cover" />
            </div>
            <h3 ref={groomNameRef} className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)', opacity: 0 }}>
              {WEDDING.groom}
            </h3>
            <div className="ornament-divider max-w-[120px] mx-auto mb-3">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p ref={groomParentsRef} className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0 }}>
              Putra dari<br />
              <span className="not-italic font-medium" style={{ color: 'var(--cream)' }}>{WEDDING.groomParents}</span>
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
              <img src="/images/bride.jpg" alt={WEDDING.bride} className="w-full h-full object-cover" />
            </div>
            <h3 ref={brideNameRef} className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)', opacity: 0 }}>
              {WEDDING.bride}
            </h3>
            <div className="ornament-divider max-w-[120px] mx-auto mb-3">
              <span className="text-[var(--gold)] text-xs">&#10047;</span>
            </div>
            <p ref={brideParentsRef} className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--cream)', opacity: 0 }}>
              Putri dari<br />
              <span className="not-italic font-medium" style={{ color: 'var(--cream)' }}>{WEDDING.brideParents}</span>
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
          Tidak ada yang kebetulan di dunia ini, semua sudah tersusun rapih oleh sang maha kuasa, kita tidak bisa memilih kepada siapa kita akan jatuh cinta, awal kami bertemu pada tahun 2020. Tidak ada yang pernah meyangka bahwa pertemuan itu membawa kami pada suatu ikatan yang suci.
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

    const totalItems = WEDDING.timeline.length

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
      const item = WEDDING.timeline[index]
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
      {/* Progress bar — thin gold line at top */}
      <div
        ref={progressRef}
        className="absolute top-0 left-0 right-0 h-[1px] z-20"
        style={{ background: 'linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-dark))', transform: 'scaleX(0)', transformOrigin: 'left center' }}
      />

      <div className="max-w-lg mx-auto">
        {/* Section heading */}
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
              {WEDDING.timeline[0]?.year}
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
  const { days, hours, minutes, seconds } = useCountdown(WEDDING.akadDate)

  useEffect(() => {
    const ctx = gsap.context(() => {
      fadeIn(sectionRef.current!, { duration: 1.2, y: 20 })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} data-section="countdown" className="batik-kawung cinema-depth py-28 px-6 text-center" style={{ opacity: 0 }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Menghitung Hari
        </h2>
        <div className="ornament-divider max-w-xs mx-auto mb-14">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
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
                  color: 'var(--gold)',
                  animation: i === 0 ? 'breathe 4s ease-in-out infinite' : undefined,
                }}
              >
                {String(item.value).padStart(2, '0')}
              </div>
              <p
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase mt-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
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
            {WEDDING.venue}
          </p>
          <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
            {WEDDING.address}
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  // Detect mobile once
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Organic rotations — slightly different each time, like scattered photos on a table
  const rotations = useRef(
    WEDDING.galleryImages.map(() => Math.round((Math.random() - 0.5) * 12))
  )

  // Organic depth offsets — memories overlap and layer like a dream collage
  // Featured photos are closer (bigger scale), background memories are further
  const depthOffsets = useRef(
    WEDDING.galleryImages.map((_, i) => {
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
    WEDDING.galleryImages.map((_, i) => {
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
    WEDDING.galleryImages.map((_, i) => {
      if (i === 0) return 0 // First memory: center anchor
      return (Math.random() - 0.5) * 30
    })
  )

  useEffect(() => {
    const ctx = gsap.context(() => {
      const section = sectionRef.current!
      fadeIn(section, { duration: 1.2, y: 20 })

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

      // ─── Golden light cascade — photos reveal one by one ───
      const memories = section.querySelectorAll('.memory-photo')
      if (memories.length > 0) {
        memories.forEach((memory, i) => {
          const depth = depthOffsets.current[i]
          const isFeatured = i % 4 === 0
          const isFirst = i === 0

          // Stagger — cascade from left to right, like turning pages
          const cascadeDelay = isMobile ? 0.15 * i : 0.22 * i
          const featuredPulse = isFeatured ? 0.15 : 0
          const staggerDelay = cascadeDelay + featuredPulse

          // Parallax depth — closer memories rise faster
          const depthSpeed = isFeatured ? 1.2 : isFirst ? 1.4 : 0.7 + Math.random() * 0.3
          const startY = (isMobile ? 60 : 100) * depthSpeed
          const startScale = (depth.scale || 0.9) * 0.4

          // Each photo arrives from a unique angle
          const arriveAngle = (Math.random() - 0.5) * 20
          const arriveX = (Math.random() - 0.5) * 60

          // CINEMATIC REVEAL — four phases:
          // 1. Rise from depth (parallax fog)
          // 2. Golden shimmer (opacity peak + scale overshoot)
          // 3. Focus & settle (de-blur + final position)
          // 4. Breathing float (alive, organic)

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 30%',
              toggleActions: 'play none none none',
            },
            delay: staggerDelay,
          })

          // Phase 1: Rise from deep fog — like a memory surfacing from the dark
          tl.fromTo(memory,
            {
              opacity: 0,
              x: arriveX,
              y: startY,
              scale: startScale,
              rotation: arriveAngle,
              filter: 'blur(16px) brightness(0.3)',
            },
            {
              opacity: depth.opacity * 0.4,
              x: depth.x * 2,
              y: (verticalOffsets.current[i] || 0) + depth.y * 2,
              scale: depth.scale * 0.75,
              rotation: rotations.current[i] + (Math.random() - 0.5) * 4,
              filter: 'blur(8px) brightness(0.7)',
              duration: isMobile ? 0.7 : 1.0,
              ease: 'power2.out',
            }
          )

          // Phase 2: Golden shimmer — light catches the photo, a brief flash
          tl.to(memory, {
            opacity: Math.min(depth.opacity * 1.1, 1),
            scale: depth.scale * 1.06,
            filter: 'blur(2px) brightness(1.3)',
            duration: isMobile ? 0.3 : 0.4,
            ease: 'power2.in',
          })

          // Phase 3: Focus & settle — eye adjusts, memory becomes clear
          tl.to(memory, {
            opacity: depth.opacity,
            x: depth.x,
            y: (verticalOffsets.current[i] || 0) + depth.y,
            scale: depth.scale,
            rotation: rotations.current[i],
            filter: 'blur(0px) brightness(1)',
            duration: isMobile ? 0.5 : 0.7,
            ease: isFeatured ? 'back.out(1.6)' : 'power3.out',
          })

          // Phase 4: Breathing float — the memory is alive, gently drifting
          tl.call(() => {
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
        setLightboxIndex((prev) => prev !== null ? (prev - 1 + WEDDING.galleryImages.length) % WEDDING.galleryImages.length : null)
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => prev !== null ? (prev + 1) % WEDDING.galleryImages.length : null)
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
        setLightboxIndex((lightboxIndex - 1 + WEDDING.galleryImages.length) % WEDDING.galleryImages.length)
      } else if (diff < 0 && lightboxIndex !== null) {
        setLightboxIndex((lightboxIndex + 1) % WEDDING.galleryImages.length)
      }
    }
    setTouchStart(null)
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + WEDDING.galleryImages.length) % WEDDING.galleryImages.length)
    }
  }
  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % WEDDING.galleryImages.length)
    }
  }

  return (
    <section ref={sectionRef} data-section="gallery" className="diary-paper-bg cinema-depth py-28 px-6" style={{ opacity: 0 }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="gallery-title text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Momen Kami
        </h2>
        <div className="gallery-ornament ornament-divider max-w-xs mx-auto mb-14">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>

        {/* Memories returning one by one — like photos surfacing from a dream */}
        <div className="gallery-memories">
          {WEDDING.galleryImages.map((img, index) => {
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
              aria-label={`Lihat foto ${WEDDING.galleryCaptions[index]}`}
              onKeyDown={(e) => { if (e.key === 'Enter') openLightbox(index) }}
            >
              <div className="aspect-[4/5] overflow-hidden bg-[var(--cream-dark)]">
                <img
                  src={img}
                  alt={WEDDING.galleryCaptions[index]}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <p
                className="text-center text-xs sm:text-sm italic mt-1"
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}
              >
                {WEDDING.galleryCaptions[index]}
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
              src={WEDDING.galleryImages[lightboxIndex]}
              alt={WEDDING.galleryCaptions[lightboxIndex]}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            <p
              className="text-center text-sm italic mt-4"
              style={{ fontFamily: 'var(--font-serif)', color: 'rgba(255,255,255,0.6)' }}
            >
              {WEDDING.galleryCaptions[lightboxIndex]}
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

function ClosingSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const transRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const finalRef = useRef<HTMLDivElement>(null)
  const arabicRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
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

      el.innerHTML = ''
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
        el.appendChild(ws)
        if (wi < words.length - 1) {
          const sp = document.createElement('span')
          sp.innerHTML = '\u00A0'
          sp.style.display = 'inline'
          el.appendChild(sp)
        }
      })

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

    // ScrollTrigger — Start animation when section is well into viewport
    // Uses top 30% instead of top 80% so animations only start when the
    // section is prominently visible (not just barely entering from bottom).
    // Auto-scroll speed already dropped to 0.8x at top 90%, so by the time
    // this triggers, the section is scrolling slowly and animations are visible.
    ScrollTrigger.create({
      trigger: section,
      start: 'top 30%',
      onEnter: () => {
        if (hasAnimated.current) return
        hasAnimated.current = true

        // Fade section in
        gsap.to(section, { opacity: 1, duration: 1, ease: 'power2.out' })

        // ═══ PHASE 1: HANDWRITING ═══
        const titleEnd = closingHandwriting(titleRef.current, 0.035, 0.1, 0.3)
        const subtitleEnd = closingHandwriting(subtitleRef.current, 0.03, 0.09, titleEnd + 0.5)

        // Arabic appears gently — no handwriting
        if (arabicRef.current) {
          gsap.to(arabicRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out', delay: subtitleEnd + 0.3 })
        }

        const transEnd = closingHandwriting(transRef.current, 0.025, 0.08, subtitleEnd + 1.0)

        // Divider appears
        if (dividerRef.current) {
          gsap.to(dividerRef.current, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(2)', delay: transEnd + 0.3 })
        }

        const footerEnd = closingHandwriting(footerRef.current, 0.035, 0.1, transEnd + 0.8)
        const finalEnd = closingHandwriting(finalRef.current, 0.06, 0.15, footerEnd + 0.8)

        // ═══ PHASE 2: DUST DISSOLVE ═══
        // After everything is written, hold for a moment...
        // Then the story evaporates like dust
        const dustDelay = finalEnd + 2.5 // hold 2.5s to let it sink in

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
        // The story is gone, but the prayer stays
        // Arabic text stays visible (it's permanent — the doa doesn't dissolve)
        // Date appears — the only thing left after the dust settles
        const afterDust = Math.max(titleDust, subtitleDust, transDust, footerDust, finalDust) + 1.0

        if (dateRef.current) {
          gsap.to(dateRef.current, { opacity: 1, duration: 2, ease: 'power2.out', delay: afterDust })
        }

        // ═══ SIGNAL: Closing animation complete ═══
        // Dispatch event after ALL animations finish (including date fade-in)
        // This tells auto-scroll to resume at 0.8x speed
        const totalEndTime = afterDust + 2.5 // date fade-in duration + buffer
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('closing-animation-complete'))
        }, totalEndTime * 1000)
      },
    })
  }, [])

  return (
    <section ref={sectionRef} data-section="closing" className="batik-kawung-dark cinema-vignette cinema-bloom cinema-dust diary-page-close relative py-28 px-6 text-center overflow-hidden" style={{ opacity: 0 }}>
      {/* Gold light leak */}
      <div className="gold-light-leak absolute inset-0 pointer-events-none" />

      {/* Final petals — the last visible movement before silence */}
      <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
        {[15, 35, 55, 72, 88].map((left, i) => (
          <div
            key={`final-petal-${i}`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: '-20px',
              width: `${8 + i * 2}px`,
              height: `${10 + i * 2}px`,
              opacity: 0,
              animation: `finalPetalDrift ${7 + i * 1.5}s ease-in ${5 + i * 1.5}s forwards`,
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 20 24" fill="none">
              <path d="M10 0C10 0 14 4 14 10C14 16 10 24 10 24C10 24 6 16 6 10C6 4 10 0 10 0Z"
                fill={`rgba(201,169,110,${0.2 + i * 0.04})`} />
            </svg>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Title — handwriting reveal, then dust dissolve */}
        <div ref={titleRef} className="text-lg sm:text-xl leading-relaxed mb-8" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', fontStyle: 'italic' }}>
          Dan seperti semua cerita indah yang dituliskan semesta, kisah kami baru saja dimulai.
        </div>

        {/* Subtitle — handwriting, then dust */}
        <div ref={subtitleRef} className="text-sm sm:text-base leading-relaxed mb-10" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', opacity: 0.85, fontStyle: 'italic' }}>
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
          <div ref={transRef} className="text-xs italic" style={{ fontFamily: 'Inter, sans-serif', color: 'var(--gold)' }}>
            Barakallahu lakuma wa baraka&lsquo;alaikuma wa jama&lsquo;a bainakuma fi khair.
          </div>
        </div>

        {/* Small divider */}
        <div ref={dividerRef} className="ornament-divider max-w-[120px] mx-auto mb-6" style={{ opacity: 0, transform: 'scale(0.5)' }}>
          <span className="text-[var(--gold)] text-xs">&#10047;</span>
        </div>

        {/* Footer line — handwriting, then dust */}
        <div ref={footerRef} className="text-sm mb-16" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', opacity: 0.6, fontStyle: 'italic' }}>
          Forever starts with Bismillah.
        </div>

        {/* Final emotional line — handwriting, then dust */}
        <div ref={finalRef} className="text-2xl sm:text-3xl min-h-[2em]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', fontWeight: 300, fontStyle: 'italic' }}>
          Cerita mereka belum selesai...
        </div>

        {/* The date — appears after dust settles, the only thing left */}
        <div
          ref={dateRef}
          className="mt-8"
          style={{ opacity: 0 }}
        >
          <p
            className="text-sm tracking-[0.4em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#ffffff', opacity: 0.7 }}
          >
            05 . 07 . 2026
          </p>
        </div>
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
   DELETED: LamaranSection and MenikahSection (covered in Timeline)
   ADDED: Auto-scroll cinematic experience
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const userScrollingRef = useRef(false)

  const handlePreloaderComplete = useCallback(() => setIsLoading(false), [])

  const handleOpenStart = useCallback(() => {
    // Start music IMMEDIATELY when user taps "Buka" — don't wait for cover animation
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
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

  // ═══════════════════════════════════════════════════════════
  // AUTO-SCROLL — Time accumulator approach
  //
  // WHY THIS WORKS (and the old approach didn't):
  // - Old: velocity ramp + lerp + dt normalization = varying scroll per frame = STUTTER
  // - New: fixed px/s rate + time accumulator = constant scroll speed = BUTTER SMOOTH
  //
  // The key insight: stuttering comes from UNEQUAL scroll amounts per frame.
  // When velocity changes every frame (ramp/lerp/decay), each frame scrolls
  // a different amount → visible jerkiness. By using a time accumulator that
  // only scrolls WHOLE pixels, the browser gets a consistent scroll delta
  // every frame, eliminating stutter completely.
  //
  // Only 2 things pause the scroll:
  // 1. Cinematic lock (diary/closing) — triggered by custom events
  // 2. User manual scroll — pauses for 2.5s then resumes
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isOpen) return

    let animationId: number
    let resumeTimeout: ReturnType<typeof setTimeout>
    let lastTime = 0

    // ─── Speed: pixels per millisecond ───
    // 0.025 px/ms = ~1.5 px/frame at 60fps = ~25 px/s (normal)
    // Very slow cinematic drift — like watching a story unfold page by page
    // Countdown: 2x speed = faster through countdown numbers
    // Acara: 2x speed = faster through event details
    // Gallery: 1x speed = normal cinematic pace for photos
    // RSVP→Wishes: 2x speed = cruise through RSVP/envelope/wishes
    // Closing: PAUSED during animation, then 0.8x after animation completes
    const pxPerMs = 0.025
    const pxPerMsCountdown = pxPerMs * 2  // 2x speed at countdown section
    const pxPerMsAcara = pxPerMs * 2      // 2x speed at acara section
    const pxPerMsRSVP = pxPerMs * 2       // 2x speed from RSVP onwards

    // ─── Section-aware speed using getBoundingClientRect() ───
    // WHY NOT offsetTop caching:
    // Diary pin spacer adds ~125vh to the page. When pin is killed,
    // ScrollTrigger.refresh() shifts all section positions.
    // Cached offsetTop values become stale → wrong speed zones → scroll gets stuck.
    // getBoundingClientRect() always returns real-time viewport-relative positions,
    // so it automatically handles layout shifts from pin removal.
    // We only cache the DOM element reference (not the position).
    let countdownElRef: Element | null | undefined = undefined  // undefined = not queried
    let acaraElRef: Element | null | undefined = undefined
    let galleryElRef: Element | null | undefined = undefined
    let rsvpElRef: Element | null | undefined = undefined
    let closingElRef: Element | null | undefined = undefined

    const isPastCountdown = (): boolean => {
      if (countdownElRef === undefined) countdownElRef = document.querySelector('[data-section="countdown"]')
      if (!countdownElRef) return false
      // Countdown top has reached middle of viewport
      return countdownElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastAcara = (): boolean => {
      if (acaraElRef === undefined) acaraElRef = document.querySelector('[data-section="events"]')
      if (!acaraElRef) return false
      // Acara top has reached middle of viewport
      return acaraElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastGallery = (): boolean => {
      if (galleryElRef === undefined) galleryElRef = document.querySelector('[data-section="gallery"]')
      if (!galleryElRef) return false
      // Gallery top has reached middle of viewport
      return galleryElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastRSVP = (): boolean => {
      if (rsvpElRef === undefined) rsvpElRef = document.querySelector('[data-section="rsvp"]')
      if (!rsvpElRef) return false
      // RSVP top has reached middle of viewport
      return rsvpElRef.getBoundingClientRect().top <= window.innerHeight * 0.5
    }
    const isPastClosing = (): boolean => {
      if (closingElRef === undefined) closingElRef = document.querySelector('[data-section="closing"]')
      if (!closingElRef) return false
      // Closing top has just entered the viewport from bottom (90% from top)
      // This triggers the cinematic lock BEFORE the closing animation ScrollTrigger (top 30%),
      // so auto-scroll pauses, then animations start when section is fully visible
      return closingElRef.getBoundingClientRect().top <= window.innerHeight * 0.9
    }

    // ─── State ───
    let cinematicLock = false
    let closingAnimDone = false  // true after closing animation fully completes
    let accumulated = 0  // Fractional pixel accumulator

    // ─── rAF tick ───
    const tick = (time: number) => {
      animationId = requestAnimationFrame(tick)

      // First frame — seed lastTime, don't scroll
      if (lastTime === 0) {
        lastTime = time
        return
      }

      const delta = Math.min(time - lastTime, 50)  // Cap at 50ms to prevent huge jumps after tab switch
      lastTime = time

      // ─── Paused states — don't accumulate ───
      if (cinematicLock) {
        accumulated = 0  // Reset accumulator so resume doesn't cause a jump
        return
      }

      // ─── At bottom? Stay alive but don't scroll ───
      const atBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 50)
      if (atBottom) {
        accumulated = 0
        return
      }

      // ─── Section detection using getBoundingClientRect (real-time, no stale cache) ───
      const pastCountdown = isPastCountdown()
      const pastAcara = isPastAcara()
      const pastGallery = isPastGallery()
      const pastRSVP = isPastRSVP()
      const pastClosing = isPastClosing()
      // When closing section enters viewport, trigger cinematic lock
      // This PAUSES auto-scroll so closing animation can play fully
      if (pastClosing && !closingAnimDone) {
        cinematicLock = true  // Pause auto-scroll at closing section
      }

      // ─── Accumulate fractional pixels ───
      // 6-zone speed: normal → countdown 2x → acara 2x → gallery 1x → RSVP 2x → closing 0.8x (after anim)
      let speed: number
      if (closingAnimDone) {
        speed = pxPerMs * 0.8  // Slow drift after closing animation completes
      } else if (pastRSVP) {
        speed = pxPerMsRSVP    // 2x — cruise through RSVP/envelope/wishes
      } else if (pastGallery) {
        speed = pxPerMs        // 1x — normal cinematic pace for gallery photos
      } else if (pastAcara) {
        speed = pxPerMsAcara   // 2x — faster through acara (event details)
      } else if (pastCountdown) {
        speed = pxPerMsCountdown // 2x — faster through countdown
      } else {
        speed = pxPerMs        // 1x — Normal cinematic drift
      }
      accumulated += delta * speed

      // ─── Only scroll WHOLE pixels — avoids sub-pixel layout thrashing ───
      const wholePixels = Math.floor(accumulated)
      if (wholePixels > 0) {
        accumulated -= wholePixels
        // Use scrollTo with absolute position instead of scrollBy
        // This avoids conflicts with GSAP ScrollTrigger's internal scroll tracking
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
    // diary-sequence-start: dispatched by DiaryStorySection when scroll reaches top 0%
    // diary-sequence-complete: dispatched when diary animations finish
    // closing-animation-complete: dispatched by ClosingSection when ALL animations finish
    // Closing PAUSES auto-scroll so animation plays fully — same pattern as diary.
    const onDiaryStart = () => { cinematicLock = true }

    const onDiaryComplete = () => {
      cinematicLock = false
      userScrollingRef.current = false
      // Reset element refs so they get re-queried after diary pin removal
      // (pin removal shifts all section positions in the DOM)
      countdownElRef = undefined
      acaraElRef = undefined
      galleryElRef = undefined
      rsvpElRef = undefined
      closingElRef = undefined
    }

    const onClosingComplete = () => {
      closingAnimDone = true
      cinematicLock = false  // Resume auto-scroll at 0.8x speed
    }

    window.addEventListener('diary-sequence-start', onDiaryStart)
    window.addEventListener('diary-sequence-complete', onDiaryComplete)
    window.addEventListener('closing-animation-complete', onClosingComplete)

    return () => {
      clearTimeout(startTimeout)
      cancelAnimationFrame(animationId)
      clearTimeout(resumeTimeout)
      window.removeEventListener('diary-sequence-start', onDiaryStart)
      window.removeEventListener('diary-sequence-complete', onDiaryComplete)
      window.removeEventListener('closing-animation-complete', onClosingComplete)
    }
  }, [isOpen])

  // Music fade-out during closing section — emotional synchronization
  // The story slowly disappears into silence, not cut off abruptly
  // Gradual fade synced with dust dissolve, then brief silence at the end
  useEffect(() => {
    if (!isOpen || !audioRef.current) return

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
            // Gradual volume reduction — slow, emotional, synchronized with text dissolve
            // Five-phase fade: barely perceptible → slowly getting quieter → noticeable → fading → last whispers
            fadeInterval = setInterval(() => {
              if (audio.volume > 0.02) {
                const reduction = audio.volume > 0.7
                  ? 0.002   // Phase 1: Barely perceptible
                  : audio.volume > 0.5
                    ? 0.003  // Phase 2: Slowly getting quieter
                    : audio.volume > 0.3
                      ? 0.005 // Phase 3: Noticeable fade
                      : audio.volume > 0.15
                        ? 0.008 // Phase 4: Fading
                        : 0.012 // Phase 5: Last whispers
                audio.volume = Math.max(0, audio.volume - reduction)
              } else {
                // Sound has faded to near-zero
                audio.volume = 0
                // Brief moment of silence before full pause — let the absence of sound be felt
                if (fadeInterval) clearInterval(fadeInterval)
                silenceTimeout = setTimeout(() => {
                  audio.pause()
                  setIsPlaying(false)
                }, 2500) // 2.5s of pure silence before full pause — the emotional breath
              }
            }, 120) // Slower interval for smoother fade
          }
        })
      },
      { threshold: 0.1 } // Start fading earlier (10%) for more gradual transition
    )

    observer.observe(closingSection)

    return () => {
      observer.disconnect()
      if (fadeInterval) clearInterval(fadeInterval)
      if (silenceTimeout) clearTimeout(silenceTimeout)
    }
  }, [isOpen, isPlaying])

  return (
    <>
      <audio ref={audioRef} src="/music/gamelan-bg.mp3" loop preload="auto" />

      {isLoading && (
        <Preloader
          onComplete={handlePreloaderComplete}
          groomName={WEDDING.groom}
          brideName={WEDDING.bride}
        />
      )}

      {!isLoading && !isOpen && (
        <Suspense fallback={null}>
          <CoverSectionComponent onOpen={handleOpen} onOpenStart={handleOpenStart} />
        </Suspense>
      )}

      {!isLoading && isOpen && (
        <SmoothScroll>
          <main className="relative" style={{ touchAction: 'manipulation' }}>
            <CursorFollower />
            <JasmineParticles />

            {/* The Diary — each section is a page */}
            <BismillahSection />
            <CoupleSection />
            <DiaryIntroSection />
            <DiaryStorySection />
            {/* LamaranSection and MenikahSection REMOVED — covered in Timeline */}
            <CountdownSection />
            <EventSection />
            <GallerySection />
            <RSVPSection />
            <DigitalEnvelope />
            <GuestWishes />
            <ClosingSection />
            <FooterSection />
          </main>

          <MusicPlayerComponent
            isPlaying={isPlaying}
            onToggle={toggleMusic}
            audioRef={audioRef}
          />
          <ScrollToTop />
        </SmoothScroll>
      )}
    </>
  )
}
