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
 *  They never reach the bottom. The wind holds them.
 *  Sometimes they drift closer, sometimes further apart.
 *  During diary sections, they hover near each other —
 *  close, but not yet together.
 *
 *  Only at the closing section do they finally descend —
 *  falling gently to the same place at the BOTTOM, side by side.
 *  Because now, both are finally together.
 *
 *  Visual meaning:
 *  "Dua perjalanan berbeda, terbawa arah angin
 *   yang kadang berlawanan, kadang sejalan,
 *   tapi akhirnya sampai di tempat yang sama."
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
      // Leaf A — elongated, warm brown, slightly curled
      el.innerHTML = `
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C14 0 22 6 24 14C26 22 20 34 14 36C8 34 2 22 4 14C6 6 14 0 14 0Z"
            fill="rgba(139,100,50,0.7)" stroke="rgba(92,74,50,0.5)" stroke-width="0.5"/>
          <path d="M14 3L14 33" stroke="rgba(92,74,50,0.6)" stroke-width="0.6" stroke-linecap="round"/>
          <path d="M14 8L9 5" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 8L19 5" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 14L8 11" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 14L20 11" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 20L7 18" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 20L21 18" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 26L9 24" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 26L19 24" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 0C14 0 22 6 24 14" stroke="rgba(201,169,110,0.25)" stroke-width="0.3" fill="none"/>
          <circle cx="11" cy="16" r="1.5" fill="rgba(166,123,61,0.2)"/>
        </svg>
      `
    } else {
      // Leaf B — rounder, deeper brown, golden edges
      el.innerHTML = `
        <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 0C13 0 21 4 24 12C26 20 20 30 13 34C6 30 0 20 2 12C5 4 13 0 13 0Z"
            fill="rgba(107,66,38,0.7)" stroke="rgba(92,74,50,0.5)" stroke-width="0.5"/>
          <path d="M13 3C13 3 12.5 17 13 31" stroke="rgba(92,74,50,0.6)" stroke-width="0.6" stroke-linecap="round" fill="none"/>
          <path d="M13 7L7 4" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M13 7L19 4" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 13L6 10" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 13L19 10" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 19L5 17" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 19L20 17" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.8 25L7 23" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.8 25L18.5 23" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M13 0C13 0 21 4 24 12" stroke="rgba(201,169,110,0.3)" stroke-width="0.4" fill="none"/>
          <path d="M13 0C13 0 5 4 2 12" stroke="rgba(201,169,110,0.2)" stroke-width="0.3" fill="none"/>
          <circle cx="15" cy="14" r="1.2" fill="rgba(166,123,61,0.25)"/>
          <circle cx="10" cy="22" r="1" fill="rgba(166,123,61,0.2)"/>
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
      rotationVel: id === 'A' ? 0.08 : -0.06,
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
        if (rect.top < vh * 0.6) {
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
      const proximity = Math.min(1, Math.max(0, scrollP * 1.2 - 0.1))
      const togetherX = vw * 0.5

      leavesRef.current.forEach(leaf => {
        // ─── Fade in gently at start ───
        if (!leaf.isClosing && leaf.opacity < 0.6) {
          leaf.opacity = Math.min(0.6, leaf.opacity + 0.003)
        }

        if (leaf.isClosing) {
          // ═══════════════════════════════════════════
          //  CLOSING: Both leaves descend to the BOTTOM
          //  of the closing section, side by side
          //  Kedua mempelai sudah bersama
          // ═══════════════════════════════════════════
          leaf.closingProgress = Math.min(1, leaf.closingProgress + 0.0012)

          const p = leaf.closingProgress
          // Ease: gentle start, breathing middle, soft landing
          const ease = p < 0.3
            ? p * p * 3.33           // slow start
            : p < 0.7
              ? 0.3 + (p - 0.3) * 1.5 * 0.7  // steady drift
              : 1 - Math.pow(1 - p, 3)        // soft landing

          // Both converge to the center, at the BOTTOM of the closing section
          const sideOffset = leaf.id === 'A' ? -10 : 10 // A left, B right — side by side
          const targetX = togetherX + sideOffset
          // Bottom of the closing section viewport
          const closingRect = closingSection?.getBoundingClientRect()
          const targetY = closingRect
            ? closingRect.bottom - 80 // land near the bottom of the section
            : vh * 0.85

          leaf.x = leaf.closingStartX + (targetX - leaf.closingStartX) * ease
          leaf.y = leaf.closingStartY + (targetY - leaf.closingStartY) * ease

          // Rotation eases to a gentle resting angle — spinning slows to a stop
          const restRotation = leaf.id === 'A' ? 5 : -8
          leaf.rotation = leaf.closingStartRotation + (restRotation - leaf.closingStartRotation) * ease

          // Scale gently grows — they're coming forward, towards the viewer
          leaf.scale = leaf.closingStartScale + (1.15 - leaf.closingStartScale) * ease

          // Opacity warms as they arrive together
          leaf.opacity = 0.6 + ease * 0.3

        } else {
          // ═══════════════════════════════════════════
          //  DRIFTING: Two different journeys
          //  Natural buoyancy, carefully designed imperfection
          //  They never reach the bottom. The wind holds them.
          // ═══════════════════════════════════════════

          // ─── Buoyancy system ───
          const restY = vh * 0.35 // their natural floating altitude
          const buoyancy = (leaf.y - restY) * -0.003 // updraft when below rest
          const gravity = 0.003 // gentle downward pull

          // Vertical: gravity pulls down, buoyancy pushes up
          leaf.vy += gravity + buoyancy
          // Organic vertical drift — breathing, like floating in warm air
          leaf.vy += organicNoise(t * 0.3, leaf.id === 'A' ? 0 : 5) * 0.008
          // Damping — slow, viscous air
          leaf.vy *= 0.97
          leaf.y += leaf.vy

          // Never reach the bottom — hard buoyancy floor
          const maxFloatY = vh * 0.55
          if (leaf.y > maxFloatY) {
            leaf.y = maxFloatY
            leaf.vy = Math.min(0, leaf.vy)
          }
          if (leaf.y < -30) {
            leaf.y = -30
            leaf.vy = Math.max(0, leaf.vy)
          }

          // ─── Horizontal drift with scroll proximity ───
          const baseX = leaf.id === 'A' ? vw * 0.25 : vw * 0.75

          // Target X shifts closer together as scroll progresses
          const soloX = baseX
          const closeX = togetherX + (leaf.id === 'A' ? -40 : 40)
          const targetBaseX = soloX + (closeX - soloX) * proximity * 0.6

          // Organic horizontal sway — multiple frequencies for imperfection
          const sway1 = organicNoise(t * 0.4, leaf.id === 'A' ? 1 : 6) * 45
          const sway2 = organicNoise(t * 0.15, leaf.id === 'A' ? 2 : 7) * 25
          const gust = organicNoise(t * 0.08, 3) * 20 * leaf.swayDirection

          const targetX = targetBaseX + sway1 + sway2 + gust

          // Smooth approach to target — like being carried by air currents
          leaf.vx += (targetX - leaf.x) * 0.005
          leaf.vx *= 0.95 // viscous air damping
          leaf.x += leaf.vx

          // Keep within bounds
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ─── Rotation — natural tumbling, influenced by movement ───
          const moveRotation = leaf.vx * 3 // turning into the direction of drift
          const breatheRotation = organicNoise(t * 0.5, leaf.id === 'A' ? 4 : 9) * 8
          leaf.rotationVel += (moveRotation + breatheRotation - leaf.rotationVel) * 0.03
          leaf.rotation += leaf.rotationVel

          // ─── Scale — forward drift, organic breathing ───
          const forwardDrift = organicNoise(t * 0.25, leaf.id === 'A' ? 3 : 8)
          const targetScale = 0.75 + forwardDrift * 0.35 + proximity * 0.1
          leaf.scale += (targetScale - leaf.scale) * 0.02

          // ─── Opacity — clearer when closer to viewer (bigger scale) ───
          const scaleNorm = (leaf.scale - 0.75) / 0.45
          leaf.opacity = 0.4 + scaleNorm * 0.3 + proximity * 0.1
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
