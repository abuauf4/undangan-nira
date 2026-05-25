'use client'

import { useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion } from '@/lib/animations'

/**
 * ═══════════════════════════════════════════════════════════
 *  DRIED LEAVES — CSS 3D Transform
 * ═══════════════════════════════════════════════════════════
 *
 *  Two dried leaves carried by wind through the invitation.
 *  At closing: both leaves PULL toward center of closing section.
 *  Exponential pull (not start/end interpolation) = robust
 *  regardless of starting position.
 *  Hard clamp: daun TIDAK BOLEH melewati titik jatuh.
 *
 *  "Dua daun kering, terbawa angin,
 *   kadang miring, kadang telungkup,
 *   tapi akhirnya berlabuh di tempat yang sama."
 * ═══════════════════════════════════════════════════════════
 */

type LeafPhase = 'drifting' | 'closing' | 'landed'

interface Leaf {
  id: 'A' | 'B'
  x: number
  y: number
  vx: number
  vy: number
  rotateX: number
  rotateY: number
  rotateZ: number
  rotateXVel: number
  rotateYVel: number
  rotateZVel: number
  scale: number
  opacity: number
  element: HTMLDivElement
  swayDirection: number
  phase: LeafPhase
  closingProgress: number
  closingStartRotateX: number
  closingStartRotateY: number
  closingStartRotateZ: number
  closingStartScale: number
  landRotateZ: number
}

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
  const leavesUnitedRef = useRef(false)
  const scrollProgressRef = useRef(0)
  const closingElRef = useRef<Element | null>(null)

  const createLeafElement = (id: 'A' | 'B'): HTMLDivElement => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.pointerEvents = 'none'
    el.style.willChange = 'transform, opacity'
    el.style.left = '0'
    el.style.top = '0'
    el.style.transformStyle = 'preserve-3d'
    el.style.zIndex = id === 'A' ? '1' : '2'

    if (id === 'A') {
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
    const startX = id === 'A' ? vw * 0.25 : vw * 0.75

    return {
      id,
      x: startX,
      y: -60,
      vx: 0,
      vy: 0,
      rotateX: id === 'A' ? 15 : -20,
      rotateY: id === 'A' ? 20 : -15,
      rotateZ: id === 'A' ? 12 : -18,
      rotateXVel: 0,
      rotateYVel: 0,
      rotateZVel: 0,
      scale: 0.7,
      opacity: 0,
      element: el,
      swayDirection: id === 'A' ? 1 : -1,
      phase: 'drifting',
      closingProgress: 0,
      closingStartRotateX: 0,
      closingStartRotateY: 0,
      closingStartRotateZ: 0,
      closingStartScale: 1,
      landRotateZ: 0,
    }
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    const leafA = createLeaf(container, 'A')
    const leafB = createLeaf(container, 'B')
    leavesRef.current = [leafA, leafB]

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollProgressRef.current = docHeight > 0 ? window.scrollY / docHeight : 0
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // When closing starts: switch to closing, reset velocity
    const onClosingStart = () => {
      if (closingTriggeredRef.current) return
      closingTriggeredRef.current = true

      // Cache closing section element
      closingElRef.current = document.querySelector('[data-section="closing"]')

      leavesRef.current.forEach(leaf => {
        leaf.phase = 'closing'
        leaf.closingProgress = 0
        // KILL all velocity — daun ga boleh bawa momentum drifting ke closing
        leaf.vx = 0
        leaf.vy = 0
        leaf.closingStartRotateX = leaf.rotateX
        leaf.closingStartRotateY = leaf.rotateY
        leaf.closingStartRotateZ = leaf.rotateZ
        leaf.closingStartScale = leaf.scale

        leaf.landRotateZ = leaf.id === 'A'
          ? 5 + Math.random() * 10
          : -8 + Math.random() * 6
      })
    }
    window.addEventListener('closing-sequence-start', onClosingStart)

    let startTime = 0

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const t = (time - startTime) * 0.001

      const vw = window.innerWidth
      const vh = window.innerHeight
      const scrollP = scrollProgressRef.current
      const proximity = Math.min(1, Math.max(0, scrollP * 1.3 - 0.1))
      const togetherX = vw * 0.5
      const scrollParallax = window.scrollY * 0.08

      leavesRef.current.forEach(leaf => {
        // ─── Fade in at start ───
        if (leaf.phase === 'drifting' && leaf.opacity < 0.35) {
          leaf.opacity = Math.min(0.35, leaf.opacity + 0.002)
        }

        if (leaf.phase === 'landed') {
          // ═══════════════════════════════════════════════════════════
          //  LANDED: Daun udah numpuk, ga gerak lagi
          //  Track closing section dynamically biar tetap di tempat yang bener
          // ═══════════════════════════════════════════════════════════
          const closingEl = closingElRef.current
          if (closingEl) {
            const rect = closingEl.getBoundingClientRect()
            const stackOffset = leaf.id === 'A' ? 0 : -5
            const targetVisualY = rect.top + rect.height * 0.9 + stackOffset
            leaf.y = targetVisualY - scrollParallax
          }
          // X stays at center
          const targetX = vw * 0.5 + (leaf.id === 'A' ? -5 : 5)
          leaf.x = targetX

        } else if (leaf.phase === 'closing') {
          // ═══════════════════════════════════════════════════════════
          //  CLOSING: Exponential pull toward center of closing section
          //  - Each frame: pull leaf closer to target
          //  - Pull strength increases with progress
          //  - HARD CLAMP: daun TIDAK BOLEH melewati titik jatuh
          //  - X: converge to center, no sway
          //  - Y: fall down to closing section bottom, never go past
          // ═══════════════════════════════════════════════════════════
          const speed = 0.002
          leaf.closingProgress = Math.min(1, leaf.closingProgress + speed)
          const p = leaf.closingProgress

          // Target: center of closing section
          const closingEl = closingElRef.current
          if (closingEl) {
            const rect = closingEl.getBoundingClientRect()
            const stackOffset = leaf.id === 'A' ? 0 : -5
            const targetVisualY = rect.top + rect.height * 0.9 + stackOffset
            const targetX = vw * 0.5 + (leaf.id === 'A' ? -5 : 5)

            // ─── X: exponential pull toward center ───
            // Pull strength increases with progress: 1% → 8%
            const xPull = 0.01 + p * 0.07
            leaf.x += (targetX - leaf.x) * xPull
            // Hard clamp X: max deviation shrinks with progress
            const maxDev = 80 * (1 - p)
            leaf.x = Math.max(targetX - maxDev, Math.min(targetX + maxDev, leaf.x))

            // ─── Y: visual-space pull toward landing ───
            const currentVisualY = leaf.y + scrollParallax
            // Only pull DOWN: if leaf is already past landing, stay
            if (currentVisualY < targetVisualY) {
              // Pull strength increases with progress: 0.5% → 5%
              const yPull = 0.005 + p * 0.045
              const newVisualY = currentVisualY + (targetVisualY - currentVisualY) * yPull
              // HARD CLAMP: never go past landing
              const clampedVisualY = Math.min(newVisualY, targetVisualY)
              leaf.y = clampedVisualY - scrollParallax
            }
            // If already at/past landing, don't move Y at all
          }

          // ─── Rotation: flatten out as leaf descends ───
          const flattenEase = p * p * (3 - 2 * p)
          leaf.rotateX = leaf.closingStartRotateX * (1 - flattenEase)
          leaf.rotateY = leaf.closingStartRotateY * (1 - flattenEase)
          leaf.rotateZ = leaf.closingStartRotateZ + (leaf.landRotateZ - leaf.closingStartRotateZ) * flattenEase
          // Small tumble — decreasing
          leaf.rotateX += organicNoise(t * 0.4, leaf.id === 'A' ? 12 : 17) * 15 * (1 - p)
          leaf.rotateY += organicNoise(t * 0.3, leaf.id === 'A' ? 13 : 18) * 10 * (1 - p)

          // Scale & opacity
          leaf.scale = leaf.closingStartScale + p * 0.2
          leaf.opacity = 0.35 + p * 0.45

          // Check if landed: close enough to target OR progress full
          if (p >= 1) {
            leaf.phase = 'landed'
            leaf.rotateX = 0
            leaf.rotateY = 0
            leaf.rotateZ = leaf.landRotateZ
            leaf.scale = leaf.closingStartScale + 0.2
            leaf.opacity = 0.8
          }

        } else {
          // ═══════════════════════════════════════════════════════════
          //  DRIFTING: Air-driven, 3D rotation responds to wind
          // ═══════════════════════════════════════════════════════════

          // ─── Gravity — gentle fall from top ───
          const gravity = 0.003
          leaf.vy += gravity

          // ─── Spring — only pulls up when below equilibrium ───
          const equilibrium = vh * 0.42
          if (leaf.y > equilibrium) {
            const displacement = leaf.y - equilibrium
            leaf.vy -= displacement * 0.0004
          }

          // ─── Wind gusts ───
          const windCycle = organicNoise(t * 0.08 + (leaf.id === 'A' ? 0 : 3), 20)
          const gustStrength = windCycle > 0.2 ? windCycle * 0.008 : 0
          leaf.vy -= gustStrength

          // ─── Soft boundaries ───
          if (leaf.y > vh * 0.7) {
            const depth = (leaf.y - vh * 0.7) / (vh * 0.3)
            leaf.vy -= depth * 0.02
          }
          if (leaf.y < -50) {
            leaf.vy = Math.max(leaf.vy, 0)
          }

          // Organic vertical drift + damping
          leaf.vy += organicNoise(t * 0.25, leaf.id === 'A' ? 0 : 5) * 0.003
          leaf.vy *= 0.985
          leaf.y += leaf.vy

          // Safety clamp bottom
          if (leaf.y > vh - 20) {
            leaf.y = vh - 20
            leaf.vy = Math.min(0, leaf.vy)
          }

          // ─── Horizontal drift — wide wandering ───
          const baseX = leaf.id === 'A' ? vw * 0.25 : vw * 0.75
          const soloX = baseX
          const closeX = togetherX + (leaf.id === 'A' ? -60 : 60)
          const targetBaseX = soloX + (closeX - soloX) * proximity * 0.4

          const wander = organicNoise(t * 0.04, leaf.id === 'A' ? 1 : 6) * vw * 0.15
          const sway1 = organicNoise(t * 0.25, leaf.id === 'A' ? 2 : 7) * 40
          const sway2 = organicNoise(t * 0.5, leaf.id === 'A' ? 3 : 8) * 15
          const gust = organicNoise(t * 0.06, 3) * 20 * leaf.swayDirection
          const bigDrift = organicNoise(t * 0.025, leaf.id === 'A' ? 4 : 9) * vw * 0.08

          const targetX = targetBaseX + wander + sway1 + sway2 + gust + bigDrift

          leaf.vx += (targetX - leaf.x) * 0.004
          leaf.vx *= 0.96
          leaf.x += leaf.vx
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ═══════════════════════════════════════════════════════════
          //  3D ROTATION — driven by air movement
          // ═══════════════════════════════════════════════════════════

          const velocityPitch = Math.max(-50, Math.min(50, leaf.vy * 200))
          const tumble = organicNoise(t * 0.2, leaf.id === 'A' ? 11 : 16) * 20
          const targetRotateX = velocityPitch + tumble
          leaf.rotateXVel += (targetRotateX - leaf.rotateX) * 0.008
          leaf.rotateXVel *= 0.96
          leaf.rotateX += leaf.rotateXVel

          const velocityYaw = Math.max(-60, Math.min(60, -leaf.vx * 180))
          const edgeDrift = organicNoise(t * 0.15, leaf.id === 'A' ? 12 : 17) * 20
          const targetRotateY = velocityYaw + edgeDrift
          leaf.rotateYVel += (targetRotateY - leaf.rotateY) * 0.006
          leaf.rotateYVel *= 0.96
          leaf.rotateY += leaf.rotateYVel

          const organicSpin = organicNoise(t * 0.15, leaf.id === 'A' ? 4 : 9) * 25
          const windRoll = leaf.vx * 50
          const targetRotateZ = organicSpin + windRoll
          leaf.rotateZVel += (targetRotateZ - leaf.rotateZ) * 0.005
          leaf.rotateZVel *= 0.97
          leaf.rotateZ += leaf.rotateZVel

          // ─── Scale ───
          const forwardDrift = organicNoise(t * 0.2, leaf.id === 'A' ? 3 : 8)
          const targetScale = 0.65 + forwardDrift * 0.2 + proximity * 0.08
          leaf.scale += (targetScale - leaf.scale) * 0.015

          // ─── Opacity ───
          const scaleNorm = (leaf.scale - 0.65) / 0.28
          leaf.opacity = 0.25 + scaleNorm * 0.1 + proximity * 0.08
        }

        // Apply 3D transform
        const displayY = leaf.y + scrollParallax
        const transform = `translate3d(${leaf.x}px, ${displayY}px, 0) rotateX(${leaf.rotateX}deg) rotateY(${leaf.rotateY}deg) rotateZ(${leaf.rotateZ}deg) scale(${leaf.scale})`
        leaf.element.style.transform = transform
        leaf.element.style.opacity = String(leaf.opacity)
      })

      // Check if both leaves have landed (united)
      if (!leavesUnitedRef.current && closingTriggeredRef.current) {
        const allLanded = leavesRef.current.every(l => l.phase === 'landed')
        if (allLanded) {
          leavesUnitedRef.current = true
          window.dispatchEvent(new CustomEvent('leaves-united'))
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('closing-sequence-start', onClosingStart)
      leavesRef.current.forEach(l => l.element.remove())
      leavesRef.current = []
    }
  }, [createLeaf])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
      style={{ perspective: '1000px' }}
      aria-hidden="true"
    />
  )
}
