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
 *  Sometimes the wind pushes them forward (towards the viewer — scale up)
 *  Sometimes the wind aligns and they drift together
 *  They never reach the bottom — their journey is ongoing
 *
 *  When the closing section enters the viewport,
 *  both leaves begin their final descent —
 *  falling gently to the same place, side by side.
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
  baseX: number
  rotation: number
  rotationSpeed: number
  scale: number
  targetScale: number
  swayDirection: number  // A = +1 (right), B = -1 (left)
  swayAmplitude: number
  swaySpeed: number
  swayOffset: number
  fallSpeed: number
  driftX: number
  opacity: number
  element: HTMLDivElement
  // Closing state
  isClosing: boolean
  closingProgress: number // 0..1
  closingTargetX: number
  closingTargetY: number
  closingStartX: number
  closingStartY: number
}

export default function DriedLeaves() {
  const containerRef = useRef<HTMLDivElement>(null)
  const leavesRef = useRef<Leaf[]>([])
  const animFrameRef = useRef<number>(0)
  const isClosingRef = useRef(false)
  const closingTriggeredRef = useRef(false)

  const createLeafElement = (id: 'A' | 'B'): HTMLDivElement => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.pointerEvents = 'none'
    el.style.willChange = 'transform, opacity'
    el.style.left = '0'
    el.style.top = '0'

    // Different dried leaf shapes for A and B
    if (id === 'A') {
      // Leaf A — elongated, slightly curled, warm brown
      el.innerHTML = `
        <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main leaf body -->
          <path d="M14 0C14 0 22 6 24 14C26 22 20 34 14 36C8 34 2 22 4 14C6 6 14 0 14 0Z"
            fill="rgba(139,100,50,0.7)" stroke="rgba(92,74,50,0.5)" stroke-width="0.5"/>
          <!-- Center vein -->
          <path d="M14 3L14 33" stroke="rgba(92,74,50,0.6)" stroke-width="0.6" stroke-linecap="round"/>
          <!-- Side veins -->
          <path d="M14 8L9 5" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 8L19 5" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 14L8 11" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 14L20 11" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 20L7 18" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 20L21 18" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 26L9 24" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M14 26L19 24" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <!-- Curl edge highlight -->
          <path d="M14 0C14 0 22 6 24 14" stroke="rgba(201,169,110,0.25)" stroke-width="0.3" fill="none"/>
          <!-- Dried spot -->
          <circle cx="11" cy="16" r="1.5" fill="rgba(166,123,61,0.2)"/>
        </svg>
      `
    } else {
      // Leaf B — rounder, broader, deeper brown with golden edges
      el.innerHTML = `
        <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main leaf body — broader shape -->
          <path d="M13 0C13 0 21 4 24 12C26 20 20 30 13 34C6 30 0 20 2 12C5 4 13 0 13 0Z"
            fill="rgba(107,66,38,0.7)" stroke="rgba(92,74,50,0.5)" stroke-width="0.5"/>
          <!-- Center vein — slightly curved -->
          <path d="M13 3C13 3 12.5 17 13 31" stroke="rgba(92,74,50,0.6)" stroke-width="0.6" stroke-linecap="round" fill="none"/>
          <!-- Side veins — more curved, organic -->
          <path d="M13 7L7 4" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M13 7L19 4" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 13L6 10" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 13L19 10" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 19L5 17" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.5 19L20 17" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.8 25L7 23" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <path d="M12.8 25L18.5 23" stroke="rgba(92,74,50,0.35)" stroke-width="0.4" stroke-linecap="round"/>
          <!-- Golden edge — dried leaf catching light -->
          <path d="M13 0C13 0 21 4 24 12" stroke="rgba(201,169,110,0.3)" stroke-width="0.4" fill="none"/>
          <path d="M13 0C13 0 5 4 2 12" stroke="rgba(201,169,110,0.2)" stroke-width="0.3" fill="none"/>
          <!-- Dried spots -->
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

    // Leaf A starts left-center, Leaf B starts right-center
    const startX = id === 'A' ? vw * 0.3 : vw * 0.7
    const startY = vh * 0.2 + Math.random() * vh * 0.15

    const leaf: Leaf = {
      id,
      x: startX,
      y: startY,
      baseX: startX,
      rotation: id === 'A' ? 15 : -20,
      rotationSpeed: id === 'A' ? 0.15 : -0.12,
      scale: 1,
      targetScale: 1,
      swayDirection: id === 'A' ? 1 : -1, // A→right, B→left
      swayAmplitude: 60 + Math.random() * 40,
      swaySpeed: 0.4 + Math.random() * 0.3,
      swayOffset: id === 'A' ? 0 : Math.PI * 0.7, // offset so they don't sync perfectly
      fallSpeed: 0.08 + Math.random() * 0.06,
      driftX: 0,
      opacity: 0.65 + Math.random() * 0.2,
      element: el,
      isClosing: false,
      closingProgress: 0,
      closingTargetX: vw * 0.5,
      closingTargetY: vh * 0.55,
      closingStartX: startX,
      closingStartY: startY,
    }

    return leaf
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const container = containerRef.current
    if (!container) return

    // Create the two leaves
    const leafA = createLeaf(container, 'A')
    const leafB = createLeaf(container, 'B')
    leavesRef.current = [leafA, leafB]

    const animate = (time: number) => {
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Check if closing section is visible
      const closingSection = document.querySelector('[data-section="closing"]')
      if (closingSection && !closingTriggeredRef.current) {
        const rect = closingSection.getBoundingClientRect()
        if (rect.top < vh * 0.6) {
          closingTriggeredRef.current = true
          isClosingRef.current = true
          // Capture starting positions for smooth transition
          leavesRef.current.forEach(leaf => {
            leaf.isClosing = true
            leaf.closingStartX = leaf.x
            leaf.closingStartY = leaf.y
            // Both converge to the same point — center of screen
            leaf.closingTargetX = vw * 0.5
            leaf.closingTargetY = vh * 0.55
          })
        }
      }

      leavesRef.current.forEach(leaf => {
        if (leaf.isClosing) {
          // ═══ CLOSING: Both leaves descend to the same place ═══
          leaf.closingProgress = Math.min(1, leaf.closingProgress + 0.0015)

          // Easing: slow start, gentle arrival
          const t = leaf.closingProgress
          const ease = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2

          // Interpolate position — converging paths
          const targetOffsetX = leaf.id === 'A' ? -12 : 12 // A slightly left, B slightly right
          leaf.x = leaf.closingStartX + (leaf.closingTargetX + targetOffsetX - leaf.closingStartX) * ease
          leaf.y = leaf.closingStartY + (leaf.closingTargetY - leaf.closingStartY) * ease

          // Rotation slows as they settle
          leaf.rotation += leaf.rotationSpeed * (1 - ease * 0.8)
          leaf.scale = 1 + ease * 0.3 // slightly grow as they approach (coming towards viewer)

          // Fade to gentle opacity
          leaf.opacity = 0.6 + ease * 0.3

        } else {
          // ═══ DRIFTING: Two different journeys ═══

          // Gentle fall — very slow, they never reach bottom
          leaf.y += leaf.fallSpeed

          // Wrap vertically — when they drift too far down, gently reset to top
          // But they stay in the "floating zone" (never reach the actual bottom)
          const floatZone = vh * 0.65 // max Y before reset
          if (leaf.y > floatZone) {
            leaf.y = -20 - Math.random() * 40
            leaf.baseX = leaf.id === 'A'
              ? vw * 0.15 + Math.random() * vw * 0.35 // A: left-to-center
              : vw * 0.5 + Math.random() * vw * 0.35  // B: center-to-right
            leaf.x = leaf.baseX
          }

          // Sway — primary direction based on leaf identity
          // Leaf A tends right (+), Leaf B tends left (-)
          const primarySway = Math.sin(time * 0.0008 * leaf.swaySpeed + leaf.swayOffset) * leaf.swayAmplitude

          // Secondary cross-sway — sometimes wind pushes them together
          // This creates moments where they align
          const crossSway = Math.sin(time * 0.0005 + leaf.swayOffset * 1.3) * 20

          // Wind gusts — occasional stronger drift in their primary direction
          const gustStrength = Math.sin(time * 0.0002) * Math.sin(time * 0.0003 + leaf.id === 'A' ? 0 : 1.5)
          const gust = gustStrength * 30 * leaf.swayDirection

          // Apply horizontal position
          leaf.x = leaf.baseX + primarySway * leaf.swayDirection + crossSway + gust

          // Keep within horizontal bounds
          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // Forward drift (scale) — sometimes leaves come towards the viewer
          // Like wind pushing them forward
          const forwardDrift = Math.sin(time * 0.0006 + leaf.swayOffset * 2) * 0.5 + 0.5 // 0..1
          leaf.targetScale = 0.7 + forwardDrift * 0.6 // 0.7..1.3
          leaf.scale += (leaf.targetScale - leaf.scale) * 0.02 // smooth transition

          // Rotation — gentle tumbling
          const gustRotation = gustStrength * 0.5 * leaf.swayDirection
          leaf.rotation += leaf.rotationSpeed + gustRotation

          // When scale > 1 (coming forward), opacity increases slightly
          const scaleNorm = (leaf.scale - 0.7) / 0.6 // 0..1
          leaf.opacity = 0.45 + scaleNorm * 0.35 // 0.45..0.8
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
