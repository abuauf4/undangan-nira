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
        <svg width="30" height="40" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C18 0 28 8 31 18C34 28 26 44 18 48C10 44 2 28 5 18C8 8 18 0 18 0Z"
            fill="rgba(139,100,50,0.55)" stroke="rgba(92,74,50,0.35)" stroke-width="0.5"/>
          <path d="M18 4L18 44" stroke="rgba(92,74,50,0.4)" stroke-width="0.6" stroke-linecap="round"/>
          <path d="M18 10L11 6" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M18 10L25 6" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M18 18L10 14" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M18 18L26 14" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M18 26L9 22" stroke="rgba(201,169,110,0.2)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M18 26L27 22" stroke="rgba(201,169,110,0.2)" stroke-width="0.4" stroke-linecap="round"/>
        </svg>
      `
    } else {
      // Leaf B — rounder, deeper brown, golden edges — bride's leaf
      el.innerHTML = `
        <svg width="28" height="38" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C17 0 27 6 31 16C34 26 26 40 17 46C8 40 0 26 3 16C6 6 17 0 17 0Z"
            fill="rgba(107,66,38,0.55)" stroke="rgba(92,74,50,0.35)" stroke-width="0.5"/>
          <path d="M17 4C17 4 16.5 22 17 42" stroke="rgba(92,74,50,0.4)" stroke-width="0.6" stroke-linecap="round" fill="none"/>
          <path d="M17 9L9 5" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M17 9L25 5" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M16.5 17L8 13" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M16.5 17L25 13" stroke="rgba(201,169,110,0.25)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M16.5 25L6 21" stroke="rgba(201,169,110,0.2)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M16.5 25L27 21" stroke="rgba(201,169,110,0.2)" stroke-width="0.4" stroke-linecap="round"/>
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
      rotationVel: id === 'A' ? 0.03 : -0.02,
      scale: 0.7,
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

    // Listen for dust dissolve — leaves start converging when text melts
    const onDustDissolveStart = () => {
      if (closingTriggeredRef.current) return
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
    window.addEventListener('dust-dissolve-start', onDustDissolveStart)

    let startTime = 0

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const t = (time - startTime) * 0.001 // seconds

      const vw = window.innerWidth
      const vh = window.innerHeight

      // ─── Closing trigger is handled by custom event ───
      // DriedLeaves listens for 'dust-dissolve-start' so leaves converge
      // in sync with the text melting animation

      // ─── Scroll-based proximity ───
      const scrollP = scrollProgressRef.current
      const proximity = Math.min(1, Math.max(0, scrollP * 1.3 - 0.1))
      const togetherX = vw * 0.5

      leavesRef.current.forEach(leaf => {
        // ─── Fade in gently at start ───
        if (!leaf.isClosing && leaf.opacity < 0.35) {
          leaf.opacity = Math.min(0.35, leaf.opacity + 0.002)
        }

        if (leaf.isClosing) {
          // ═══════════════════════════════════════════════════════════
          //  CLOSING: Turun pelan aja, goyang-goyang
          //  Ga ada nukik, ga ada phase — cuma jatuh perlahan
          // ═══════════════════════════════════════════════════════════
          leaf.closingProgress = Math.min(1, leaf.closingProgress + 0.001)

          const p = leaf.closingProgress

          // Target: center bottom of closing section, side by side
          const sideOffset = leaf.id === 'A' ? -10 : 10
          const targetX = togetherX + sideOffset
          const closingRect = closingSection?.getBoundingClientRect()
          const targetY = closingRect
            ? closingRect.bottom - 80
            : vh * 0.85

          // Horizontal: goyang pelan yang makin kecil, pelan-pelan menuju tengah
          const swayAmplitude = 15 * (1 - p)
          const swayFreq = leaf.id === 'A' ? 0.3 : 0.35
          const horizontalSway = organicNoise(t * swayFreq, leaf.id === 'A' ? 10 : 15) * swayAmplitude

          // Simple linear convergence — ga ada smoothstep, ga ada fase
          leaf.x = leaf.closingStartX + (targetX - leaf.closingStartX) * p + horizontalSway

          // Vertical: turun pelan aja — konsisten dari awal sampai akhir
          // Ga ada percepatan, ga ada deselerasi, cuma turun steady
          leaf.y = leaf.closingStartY + (targetY - leaf.closingStartY) * p

          // Rotation: goyang pelan yang mereda
          const rotationSway = organicNoise(t * 0.25, leaf.id === 'A' ? 12 : 17) * 6 * (1 - p)
          const restRotation = leaf.id === 'A' ? 5 : -7
          leaf.rotation = leaf.closingStartRotation + (restRotation - leaf.closingStartRotation) * p + rotationSway

          // Scale: tenang aja
          leaf.scale = 0.65 + p * 0.15

          // Opacity: pelan-pelan lebih jelas
          leaf.opacity = 0.3 + p * 0.2

        } else {
          // ═══════════════════════════════════════════════════════════
          //  DRIFTING: Terombang-ambing angin
          //  Kadang ke kanan, kadang ke kiri, kadang ke depan
          //  Dua arah berbeda — dua perjalanan berbeda
          // ═══════════════════════════════════════════════════════════

          // ─── Buoyancy system ───
          const restY = vh * 0.35
          const buoyancy = (leaf.y - restY) * -0.002
          const gravity = 0.002

          leaf.vy += gravity + buoyancy
          leaf.vy += organicNoise(t * 0.25, leaf.id === 'A' ? 0 : 5) * 0.005
          leaf.vy *= 0.98
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

          // Kadang ke kanan, kadang ke kiri — angin sangat pelan
          const sway1 = organicNoise(t * 0.3, leaf.id === 'A' ? 1 : 6) * 25
          const sway2 = organicNoise(t * 0.12, leaf.id === 'A' ? 2 : 7) * 12
          const gust = organicNoise(t * 0.06, 3) * 10 * leaf.swayDirection

          const targetX = targetBaseX + sway1 + sway2 + gust

          // Smooth approach — angin pelan
          leaf.vx += (targetX - leaf.x) * 0.003
          leaf.vx *= 0.97
          leaf.x += leaf.vx

          // Keep within bounds — ga keluar layar
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ─── Rotation — very gentle tilt ───
          const moveRotation = leaf.vx * 1.5
          const breatheRotation = organicNoise(t * 0.4, leaf.id === 'A' ? 4 : 9) * 4
          leaf.rotationVel += (moveRotation + breatheRotation - leaf.rotationVel) * 0.02
          leaf.rotation += leaf.rotationVel

          // ─── Scale — gentle breathing ───
          const forwardDrift = organicNoise(t * 0.2, leaf.id === 'A' ? 3 : 8)
          const targetScale = 0.65 + forwardDrift * 0.2 + proximity * 0.08
          leaf.scale += (targetScale - leaf.scale) * 0.015

          // ─── Opacity — very translucent ───
          const scaleNorm = (leaf.scale - 0.65) / 0.28
          leaf.opacity = 0.25 + scaleNorm * 0.1 + proximity * 0.08
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
      window.removeEventListener('dust-dissolve-start', onDustDissolveStart)
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
