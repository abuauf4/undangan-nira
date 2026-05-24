'use client'

import { useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion } from '@/lib/animations'

/**
 * ═══════════════════════════════════════════════════════════
 *  DRIED LEAVES — Two journeys, one destination
 * ═══════════════════════════════════════════════════════════
 *
 *  Two dried leaves drift through the entire invitation.
 *  Leaf A tends to sway RIGHT — the groom's journey
 *  Leaf B tends to sway LEFT  — the bride's journey
 *
 *  They drift with natural buoyancy — carefully designed imperfection.
 *  Terombang-ambing angin: kadang ke kanan, kadang ke kiri, kadang maju.
 *  Two different directions, two different lives.
 *
 *  Only at the closing section do they finally descend —
 *  falling gently to the same place, side by side.
 *  Because now, both are finally together.
 *
 *  Visual meaning:
 *  "Dua perjalanan berbeda, terbawa arah angin
 *   yang kadang berlawanan, kadang sejalan,
 *   tapi akhirnya jatuh perlahan di tempat yang sama."
 * ═══════════════════════════════════════════════════════════
 */

interface Leaf {
  id: 'A' | 'B'
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationVel: number
  scale: number
  opacity: number
  element: HTMLDivElement
  swayDirection: number // A = +1 (right), B = -1 (left)
  isClosing: boolean
  closingProgress: number
  closingStartX: number
  closingStartY: number
  closingStartRotation: number
  closingStartScale: number
}

/**
 * Simple value noise — multiple sine waves at different frequencies
 * Creates organic, non-repeating motion that feels alive
 */
function organicNoise(t: number, seed: number): number {
  return (
    Math.sin(t * 0.7 + seed) * 0.5 +
    Math.sin(t * 1.3 + seed * 2.1) * 0.3 +
    Math.sin(t * 2.7 + seed * 0.7) * 0.15 +
    Math.sin(t * 4.1 + seed * 3.3) * 0.05
  )
}

/**
 * Smooth ease-in-out cubic
 */
function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

export default function DriedLeaves() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leavesRef = useRef<Leaf[]>([])
  const animFrameRef = useRef<number>(0)
  const closingTriggeredRef = useRef(false)
  const scrollProgressRef = useRef(0)

  const createLeafElement = (id: 'A' | 'B'): HTMLDivElement => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.pointerEvents = 'none'
    el.style.willChange = 'transform, opacity'
    el.style.left = '0'
    el.style.top = '0'

    if (id === 'A') {
      // Leaf A — elongated, warm brown, slightly curled — groom's leaf
      el.innerHTML = `
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafAGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(166,123,61,0.85)"/>
              <stop offset="50%" stop-color="rgba(139,100,50,0.9)"/>
              <stop offset="100%" stop-color="rgba(107,66,38,0.85)"/>
            </linearGradient>
          </defs>
          <path d="M18 0C18 0 28 8 31 18C34 28 26 44 18 48C10 44 2 28 5 18C8 8 18 0 18 0Z"
            fill="url(#leafAGrad)" stroke="rgba(92,74,50,0.6)" stroke-width="0.6"/>
          <path d="M18 4L18 44" stroke="rgba(92,74,50,0.7)" stroke-width="0.8" stroke-linecap="round"/>
          <path d="M18 10L11 6" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 10L25 6" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 18L10 14" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 18L26 14" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 26L9 22" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 26L27 22" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 34L11 30" stroke="rgba(201,169,110,0.4)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 34L25 30" stroke="rgba(201,169,110,0.4)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M18 0C18 0 28 8 31 18" stroke="rgba(201,169,110,0.35)" stroke-width="0.4" fill="none"/>
          <circle cx="14" cy="20" r="2" fill="rgba(166,123,61,0.25)"/>
          <circle cx="22" cy="30" r="1.5" fill="rgba(166,123,61,0.2)"/>
        </svg>
      `
    } else {
      // Leaf B — rounder, deeper brown, golden edges — bride's leaf
      el.innerHTML = `
        <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="leafBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="rgba(139,90,43,0.9)"/>
              <stop offset="50%" stop-color="rgba(107,66,38,0.9)"/>
              <stop offset="100%" stop-color="rgba(80,50,28,0.85)"/>
            </linearGradient>
          </defs>
          <path d="M17 0C17 0 27 6 31 16C34 26 26 40 17 46C8 40 0 26 3 16C6 6 17 0 17 0Z"
            fill="url(#leafBGrad)" stroke="rgba(92,74,50,0.6)" stroke-width="0.6"/>
          <path d="M17 4C17 4 16.5 22 17 42" stroke="rgba(92,74,50,0.7)" stroke-width="0.8" stroke-linecap="round" fill="none"/>
          <path d="M17 9L9 5" stroke="rgba(201,169,110,0.5)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M17 9L25 5" stroke="rgba(201,169,110,0.5)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.5 17L8 13" stroke="rgba(201,169,110,0.5)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.5 17L25 13" stroke="rgba(201,169,110,0.5)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.5 25L6 21" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.5 25L27 21" stroke="rgba(201,169,110,0.45)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.8 33L9 29" stroke="rgba(201,169,110,0.4)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M16.8 33L24 29" stroke="rgba(201,169,110,0.4)" stroke-width="0.5" stroke-linecap="round"/>
          <path d="M17 0C17 0 27 6 31 16" stroke="rgba(201,169,110,0.4)" stroke-width="0.5" fill="none"/>
          <path d="M17 0C17 0 7 6 3 16" stroke="rgba(201,169,110,0.3)" stroke-width="0.4" fill="none"/>
          <circle cx="20" cy="18" r="1.8" fill="rgba(166,123,61,0.3)"/>
          <circle cx="13" cy="28" r="1.3" fill="rgba(166,123,61,0.25)"/>
        </svg>
      `
    }

    return el
  }

  const createLeaf = useCallback((container: HTMLDivElement, id: 'A' | 'B'): Leaf => {
    const el = createLeafElement(id)
    container.appendChild(el)

    const vw = window.innerWidth
    const vh = window.innerHeight

    const startX = id === 'A' ? vw * 0.25 : vw * 0.75
    const startY = vh * 0.15

    return {
      id,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      rotation: id === 'A' ? 12 : -18,
      rotationVel: id === 'A' ? 0.05 : -0.04,
      scale: 0.85,
      opacity: 0,
      element: el,
      swayDirection: id === 'A' ? 1 : -1,
      isClosing: false,
      closingProgress: 0,
      closingStartX: startX,
      closingStartY: startY,
      closingStartRotation: 0,
      closingStartScale: 1,
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    const leafA = createLeaf(container, 'A')
    const leafB = createLeaf(container, 'B')
    leavesRef.current = [leafA, leafB]

    // Track scroll progress for proximity effect
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollProgressRef.current = docHeight > 0 ? window.scrollY / docHeight : 0
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    let startTime = 0

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const t = (time - startTime) * 0.001 // seconds

      const vw = window.innerWidth
      const vh = window.innerHeight

      // ─── Check closing section ───
      const closingSection = document.querySelector('[data-section="closing"]')
      if (closingSection && !closingTriggeredRef.current) {
        const rect = closingSection.getBoundingClientRect()
        // Trigger when closing section is well into view
        if (rect.top < vh * 0.4) {
          closingTriggeredRef.current = true
          leavesRef.current.forEach(leaf => {
            leaf.isClosing = true
            leaf.closingProgress = 0
            leaf.closingStartX = leaf.x
            leaf.closingStartY = leaf.y
            leaf.closingStartRotation = leaf.rotation
            leaf.closingStartScale = leaf.scale
          })
        }
      }

      // ─── Scroll-based proximity ───
      const scrollP = scrollProgressRef.current
      const proximity = Math.min(1, Math.max(0, scrollP * 1.3 - 0.1))
      const togetherX = vw * 0.5

      leavesRef.current.forEach(leaf => {
        // ─── Fade in gently at start ───
        if (!leaf.isClosing && leaf.opacity < 0.6) {
          leaf.opacity = Math.min(0.6, leaf.opacity + 0.003)
        }

        if (leaf.isClosing) {
          // ═══════════════════════════════════════════════════════════
          //  CLOSING: Jatuh perlahan ke tempat yang sama
          //  Dua perjalanan berbeda, akhirnya bersama
          // ═══════════════════════════════════════════════════════════
          leaf.closingProgress = Math.min(1, leaf.closingProgress + 0.002)

          const p = leaf.closingProgress
          // Three-phase easing: dramatic sway → convergence → soft landing
          let ease: number
          if (p < 0.4) {
            // Phase 1: Slow start with last swaying — masih terombang-ambing
            ease = p * p * 2.5
          } else if (p < 0.75) {
            // Phase 2: Steady convergence — angin mulai tenang, daun mulai searah
            const localP = (p - 0.4) / 0.35
            ease = 0.4 + easeInOutCubic(localP) * 0.35
          } else {
            // Phase 3: Soft landing — jatuh perlahan, mendarat bersama
            const localP = (p - 0.75) / 0.25
            ease = 0.75 + easeInOutCubic(localP) * 0.25
          }

          // Both converge to the center, side by side at the bottom of closing section
          const sideOffset = leaf.id === 'A' ? -12 : 12 // A left, B right — berdampingan
          const targetX = togetherX + sideOffset
          // Bottom of the closing section viewport
          const closingRect = closingSection?.getBoundingClientRect()
          const targetY = closingRect
            ? closingRect.bottom - 100 // land near the bottom
            : vh * 0.85

          // Add last gentle sway during closing — still terombang-ambing pelan
          const closingSway = (1 - ease) * organicNoise(t * 0.5, leaf.id === 'A' ? 10 : 15) * 15

          leaf.x = leaf.closingStartX + (targetX + closingSway - leaf.closingStartX) * ease
          leaf.y = leaf.closingStartY + (targetY - leaf.closingStartY) * ease

          // Rotation gently settles — spinning slows to rest
          const restRotation = leaf.id === 'A' ? 3 : -5
          leaf.rotation = leaf.closingStartRotation + (restRotation - leaf.closingStartRotation) * ease

          // Scale gently grows — coming forward towards the viewer
          leaf.scale = leaf.closingStartScale + (1.2 - leaf.closingStartScale) * ease

          // Opacity warms as they arrive together — tetap transparan tapi lebih jelas
          leaf.opacity = 0.6 + ease * 0.25

        } else {
          // ═══════════════════════════════════════════════════════════
          //  DRIFTING: Terombang-ambing angin
          //  Kadang ke kanan, kadang ke kiri, kadang ke depan
          //  Dua arah berbeda — dua perjalanan berbeda
          // ═══════════════════════════════════════════════════════════

          // ─── Buoyancy system ───
          const restY = vh * 0.35 // their natural floating altitude
          const buoyancy = (leaf.y - restY) * -0.003
          const gravity = 0.003 // gentle downward pull

          // Vertical: gravity pulls down, buoyancy pushes up
          leaf.vy += gravity + buoyancy
          // Organic vertical drift — breathing, like floating in warm air
          leaf.vy += organicNoise(t * 0.3, leaf.id === 'A' ? 0 : 5) * 0.008
          // Damping — slow, viscous air
          leaf.vy *= 0.97
          leaf.y += leaf.vy

          // Never reach the bottom — buoyancy keeps them floating
          const maxFloatY = vh * 0.55
          if (leaf.y > maxFloatY) {
            leaf.y = maxFloatY
            leaf.vy = Math.min(0, leaf.vy)
          }
          if (leaf.y < -40) {
            leaf.y = -40
            leaf.vy = Math.max(0, leaf.vy)
          }

          // ─── Horizontal drift — terombang-ambing angin ───
          const baseX = leaf.id === 'A' ? vw * 0.25 : vw * 0.75

          // Target X shifts closer together as scroll progresses
          const soloX = baseX
          const closeX = togetherX + (leaf.id === 'A' ? -40 : 40)
          const targetBaseX = soloX + (closeX - soloX) * proximity * 0.6

          // Kadang ke kanan, kadang ke kiri — angin lembut, bukan badai
          const sway1 = organicNoise(t * 0.4, leaf.id === 'A' ? 1 : 6) * 40  // gentle sway
          const sway2 = organicNoise(t * 0.15, leaf.id === 'A' ? 2 : 7) * 20  // secondary
          // Gust — angin kadang berhembus lebih kencang
          const gust = organicNoise(t * 0.08, 3) * 15 * leaf.swayDirection

          const targetX = targetBaseX + sway1 + sway2 + gust

          // Smooth approach to target — like being carried by air currents
          leaf.vx += (targetX - leaf.x) * 0.005
          leaf.vx *= 0.95 // viscous air damping
          leaf.x += leaf.vx

          // Keep within bounds — ga keluar layar
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ─── Rotation — gentle tilting, influenced by drift direction ───
          const moveRotation = leaf.vx * 2.5 // tilting into the wind, not spinning
          const breatheRotation = organicNoise(t * 0.5, leaf.id === 'A' ? 4 : 9) * 6
          leaf.rotationVel += (moveRotation + breatheRotation - leaf.rotationVel) * 0.03
          leaf.rotation += leaf.rotationVel

          // ─── Scale — gentle breathing ───
          const forwardDrift = organicNoise(t * 0.25, leaf.id === 'A' ? 3 : 8)
          const targetScale = 0.8 + forwardDrift * 0.3 + proximity * 0.1
          leaf.scale += (targetScale - leaf.scale) * 0.02

          // ─── Opacity — translucent, elegant ───
          const scaleNorm = (leaf.scale - 0.8) / 0.4
          leaf.opacity = 0.4 + scaleNorm * 0.2 + proximity * 0.1
        }

        // Apply transform
        const transform = `translate3d(${leaf.x}px, ${leaf.y}px, 0) rotate(${leaf.rotation}deg) scale(${leaf.scale})`
        leaf.element.style.transform = transform
        leaf.element.style.opacity = String(leaf.opacity)
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('scroll', handleScroll)
      leavesRef.current.forEach(l => l.element.remove())
      leavesRef.current = []
    }
  }, [createLeaf])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
      aria-hidden="true"
    />
  )
}
