'use client'

import { useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion } from '@/lib/animations'

/**
 * ═══════════════════════════════════════════════════════════
 *  DRIED LEAVES — CSS 3D Transform
 * ═══════════════════════════════════════════════════════════
 *
 *  Two dried leaves carried by wind through the invitation.
 *  CSS 3D transforms (rotateX/Y/Z) give them depth —
 *  they tilt sideways, tumble face-down, show edges,
 *  and drift naturally like real leaves in the air.
 *
 *  Air-driven movement: not just vertical fall,
 *  but carried by organic wind gusts.
 *  Rotation responds to velocity — falling = pitch forward,
 *  moving sideways = show edge, organic tumble always.
 *
 *  At closing: leaves fall and stack at the bottom
 *  of the closing section. DYNAMIC targeting — every
 *  frame recalculates where the closing section is on
 *  screen, so it always works regardless of scroll position.
 *  Hard clamp: leaves never go past their landing point.
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
  closingStartX: number
  closingStartY: number
  closingStartRotateX: number
  closingStartRotateY: number
  closingStartRotateZ: number
  closingStartScale: number
  landX: number
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
    // Leaf B renders on top when stacking
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
      rotateX: id === 'A' ? 15 : -20,   // slight initial pitch
      rotateY: id === 'A' ? 20 : -15,   // showing some edge
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
      closingStartX: startX,
      closingStartY: -60,
      closingStartRotateX: 0,
      closingStartRotateY: 0,
      closingStartRotateZ: 0,
      closingStartScale: 1,
      landX: 0,
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

    // When closing starts: switch to closing phase, cache closing element
    const onClosingStart = () => {
      if (closingTriggeredRef.current) return
      closingTriggeredRef.current = true

      // Cache closing section element for dynamic targeting
      closingElRef.current = document.querySelector('[data-section="closing"]')

      const vw = window.innerWidth
      const centerX = vw * 0.5

      leavesRef.current.forEach(leaf => {
        leaf.phase = 'closing'
        leaf.closingProgress = 0
        leaf.closingStartX = leaf.x
        leaf.closingStartY = leaf.y
        leaf.closingStartRotateX = leaf.rotateX
        leaf.closingStartRotateY = leaf.rotateY
        leaf.closingStartRotateZ = leaf.rotateZ
        leaf.closingStartScale = leaf.scale

        // Set landing X and rotation (Y is calculated dynamically each frame)
        if (leaf.id === 'A') {
          leaf.landX = centerX - 18
          leaf.landRotateZ = 5 + Math.random() * 10
        } else {
          leaf.landX = centerX + 10
          leaf.landRotateZ = -8 + Math.random() * 6
        }
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
          // ═══════════════════════════════════════════════════════════

        } else if (leaf.phase === 'closing') {
          // ═══════════════════════════════════════════════════════════
          //  CLOSING: Dynamic targeting — every frame recalculate
          //  where the closing section is on screen.
          //  Leaf eases toward landing, hard clamp at bottom.
          //  Daun ga boleh melewati titik jatuh.
          // ═══════════════════════════════════════════════════════════
          const speed = 0.0015
          leaf.closingProgress = Math.min(1, leaf.closingProgress + speed)

          const p = leaf.closingProgress
          // Smoothstep easing — natural deceleration
          const ease = p * p * (3 - 2 * p)

          // X: ease toward landing spot
          leaf.x = leaf.closingStartX + (leaf.landX - leaf.closingStartX) * ease

          // Y: DYNAMIC — recalculate landing target every frame
          const closingEl = closingElRef.current
          if (closingEl) {
            const rect = closingEl.getBoundingClientRect()
            // Visual landing Y: 90% down the closing section (screen coordinate)
            const stackOffset = leaf.id === 'A' ? 0 : -5
            const visualLandY = rect.top + rect.height * 0.9 + stackOffset
            // Convert visual target to leaf.y coordinate
            const targetY = visualLandY - scrollParallax
            // Leaf only moves DOWN: if target is above start, stay at start
            const clampedTarget = Math.max(leaf.closingStartY, targetY)
            // Ease from start to clamped target
            leaf.y = leaf.closingStartY + (clampedTarget - leaf.closingStartY) * ease
            // HARD CLAMP: leaf visual Y must NEVER exceed landing point
            const visualY = leaf.y + scrollParallax
            if (visualY > visualLandY) {
              leaf.y = visualLandY - scrollParallax
            }
          }

          // Gentle sway during descent — diminishing
          const swayAmp = 15 * (1 - p)
          leaf.x += organicNoise(t * 0.3, leaf.id === 'A' ? 10 : 15) * swayAmp

          // Rotation: flatten out as leaf descends
          // rotateX → 0 (flat), rotateY → 0 (flat), rotateZ → landing angle
          leaf.rotateX = leaf.closingStartRotateX * (1 - ease)
          leaf.rotateY = leaf.closingStartRotateY * (1 - ease)
          leaf.rotateZ = leaf.closingStartRotateZ + (leaf.landRotateZ - leaf.closingStartRotateZ) * ease

          // Small tumble during fall — decreasing
          leaf.rotateX += organicNoise(t * 0.4, leaf.id === 'A' ? 12 : 17) * 15 * (1 - p)
          leaf.rotateY += organicNoise(t * 0.3, leaf.id === 'A' ? 13 : 18) * 10 * (1 - p)

          // Scale & opacity — growing slightly, becoming more visible
          leaf.scale = leaf.closingStartScale + p * 0.2
          leaf.opacity = 0.35 + p * 0.45

          // Check if landed
          if (p >= 1) {
            leaf.phase = 'landed'
            leaf.x = leaf.landX
            // Final Y: recalculate one more time from current closing position
            if (closingEl) {
              const rect = closingEl.getBoundingClientRect()
              const stackOffset = leaf.id === 'A' ? 0 : -5
              const visualLandY = rect.top + rect.height * 0.9 + stackOffset
              leaf.y = visualLandY - window.scrollY * 0.08
            }
            leaf.rotateX = 0
            leaf.rotateY = 0
            leaf.rotateZ = leaf.landRotateZ
            leaf.scale = leaf.closingStartScale + 0.2
            leaf.opacity = 0.8
          }

        } else {
          // ═══════════════════════════════════════════════════════════
          //  DRIFTING: Air-driven, 3D rotation responds to wind
          //  Daun jatuh pelan dari atas, terbawa angin
          //  Rotasi 3D: jatuh = miring ke depan, menyamping = show edge
          //  Kadang rebahan, kadang telungkup, kadang miring
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

          // ─── Horizontal drift — wide wandering, like real wind-carried leaves ───
          const baseX = leaf.id === 'A' ? vw * 0.25 : vw * 0.75
          const soloX = baseX
          const closeX = togetherX + (leaf.id === 'A' ? -60 : 60)
          const targetBaseX = soloX + (closeX - soloX) * proximity * 0.4

          // Wide slow wander — leaf roams across large area
          const wander = organicNoise(t * 0.04, leaf.id === 'A' ? 1 : 6) * vw * 0.15
          // Medium sway — pushed by gusts
          const sway1 = organicNoise(t * 0.25, leaf.id === 'A' ? 2 : 7) * 40
          // Quick flutter — leaf edge vibration
          const sway2 = organicNoise(t * 0.5, leaf.id === 'A' ? 3 : 8) * 15
          // Directional wind gust — pushes left or right for a few seconds
          const gust = organicNoise(t * 0.06, 3) * 20 * leaf.swayDirection
          // Occasional big sideways drift
          const bigDrift = organicNoise(t * 0.025, leaf.id === 'A' ? 4 : 9) * vw * 0.08

          const targetX = targetBaseX + wander + sway1 + sway2 + gust + bigDrift

          leaf.vx += (targetX - leaf.x) * 0.004
          leaf.vx *= 0.96
          leaf.x += leaf.vx
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ═══════════════════════════════════════════════════════════
          //  3D ROTATION — driven by air movement
          // ═══════════════════════════════════════════════════════════

          // rotateX (pitch): falling = tilt forward, rising = tilt back
          // Real leaves pitch forward when descending, lean back when lifted
          const velocityPitch = Math.max(-50, Math.min(50, leaf.vy * 200))
          const tumble = organicNoise(t * 0.2, leaf.id === 'A' ? 11 : 16) * 20
          const targetRotateX = velocityPitch + tumble
          leaf.rotateXVel += (targetRotateX - leaf.rotateX) * 0.008
          leaf.rotateXVel *= 0.96
          leaf.rotateX += leaf.rotateXVel

          // rotateY (yaw): moving sideways = show edge — more response since wider drift
          // Moving right = rotateY negative (showing left edge of leaf)
          const velocityYaw = Math.max(-60, Math.min(60, -leaf.vx * 180))
          const edgeDrift = organicNoise(t * 0.15, leaf.id === 'A' ? 12 : 17) * 20
          const targetRotateY = velocityYaw + edgeDrift
          leaf.rotateYVel += (targetRotateY - leaf.rotateY) * 0.006
          leaf.rotateYVel *= 0.96
          leaf.rotateY += leaf.rotateYVel

          // rotateZ (roll): organic slow spin + wind influence
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
