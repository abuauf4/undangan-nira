'use client'

import { useEffect, useRef, useCallback } from 'react'
import { prefersReducedMotion } from '@/lib/animations'

/**
 * ═══════════════════════════════════════════════════════════
 *  DRIED LEAVES — Two journeys, one destination
 * ═══════════════════════════════════════════════════════════
 *
 *  Two dried leaves fall through the entire invitation.
 *  Leaf A tends to sway RIGHT — the groom's journey
 *  Leaf B tends to sway LEFT  — the bride's journey
 *
 *  They fall slowly — carried by wind, going wherever it takes them.
 *  Kadang ke kanan, kadang ke kiri — angin yang menentukan.
 *  When they fall off the bottom, they reappear at the top.
 *  Like life's journey — always moving, sometimes returning.
 *
 *  Only at the closing section do they finally descend together —
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
  const leavesUnitedRef = useRef(false)
  const scrollProgressRef = useRef(0)

  const createLeafElement = (id: 'A' | 'B'): HTMLDivElement => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.pointerEvents = 'none'
    el.style.willChange = 'transform, opacity'
    el.style.left = '0'
    el.style.top = '0'

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
    const vh = window.innerHeight

    // Start from top — di luar viewport, baru masuk
    const startX = id === 'A' ? vw * 0.25 : vw * 0.75
    const startY = id === 'A' ? -60 : -40 // di atas viewport

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

    // Track scroll for proximity + parallax
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollProgressRef.current = docHeight > 0 ? window.scrollY / docHeight : 0
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Listen for closing start — leaves converge when closing begins
    const onClosingStart = () => {
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
    window.addEventListener('closing-sequence-start', onClosingStart)

    let startTime = 0

    const animate = (time: number) => {
      if (!startTime) startTime = time
      const t = (time - startTime) * 0.001

      const vw = window.innerWidth
      const vh = window.innerHeight

      const closingSection = document.querySelector('[data-section="closing"]')
      const scrollP = scrollProgressRef.current
      const proximity = Math.min(1, Math.max(0, scrollP * 1.3 - 0.1))
      const togetherX = vw * 0.5

      // Scroll-based parallax offset — daun ikut turun pas scroll
      // Tapi lebih pelan dari scroll, jadi keliatan melayang
      const scrollParallax = window.scrollY * 0.08

      leavesRef.current.forEach(leaf => {
        // ─── Fade in at start ───
        if (!leaf.isClosing && leaf.opacity < 0.35) {
          leaf.opacity = Math.min(0.35, leaf.opacity + 0.002)
        }

        if (leaf.isClosing) {
          // ═══════════════════════════════════════════════════════════
          //  CLOSING: Turun pelan, menuju titik yang sama
          // ═══════════════════════════════════════════════════════════
          leaf.closingProgress = Math.min(1, leaf.closingProgress + 0.0018)

          const p = leaf.closingProgress

          const sideOffset = leaf.id === 'A' ? -10 : 10
          const targetX = togetherX + sideOffset
          const closingRect = closingSection?.getBoundingClientRect()
          const targetY = closingRect
            ? closingRect.bottom - 80
            : vh * 0.85

          // Horizontal: goyang pelan yang makin kecil
          const swayAmplitude = 15 * (1 - p)
          const swayFreq = leaf.id === 'A' ? 0.3 : 0.35
          const horizontalSway = organicNoise(t * swayFreq, leaf.id === 'A' ? 10 : 15) * swayAmplitude

          leaf.x = leaf.closingStartX + (targetX - leaf.closingStartX) * p + horizontalSway

          // Vertical: turun pelan, steady
          leaf.y = leaf.closingStartY + (targetY - leaf.closingStartY) * p

          // Rotation: goyang pelan yang mereda
          const rotationSway = organicNoise(t * 0.25, leaf.id === 'A' ? 12 : 17) * 6 * (1 - p)
          const restRotation = leaf.id === 'A' ? 5 : -7
          leaf.rotation = leaf.closingStartRotation + (restRotation - leaf.closingStartRotation) * p + rotationSway

          leaf.scale = 0.65 + p * 0.15
          leaf.opacity = 0.3 + p * 0.2

        } else {
          // ═══════════════════════════════════════════════════════════
          //  DRIFTING: Daun jatuh pelan, dorong angin dari bawah
          //  Daun yang sama — bukan daun baru
          //  Konsep: daun jatuh natural, tapi angin dari bawah
          //  selalu dorong balik biar ga keluar viewport.
          //  Spring equilibrium di tengah viewport — daun
          //  mengambang natural di zona 15%-70%.
          //  Kadang angin kencang (dorong jauh ke atas),
          //  kadang lemah (daun jatuh lebih dalam).
          // ═══════════════════════════════════════════════════════════

          // ─── Spring equilibrium — titik keseimbangan di tengah viewport ───
          // Daun punya "rumah" di sekitar 42% viewport height
          // Gravitasi narik ke bawah, spring narik ke equilibrium
          // Ini bikin daun natural mengambang di tengah
          const equilibrium = vh * 0.42
          const displacement = leaf.y - equilibrium
          const springForce = -displacement * 0.0003 // lembut banget, biar ga kaku

          // ─── Gravity — gentle fall ───
          const gravity = 0.003
          leaf.vy += gravity + springForce

          // ─── Organic wind gusts — angin yang kadang kencang kadang lemah ───
          // Ini yang bikin daun naik turun — bukan updraft zone,
          // tapi gust yang dorong ke atas secara periodik
          const windCycle = organicNoise(t * 0.08 + (leaf.id === 'A' ? 0 : 3), 20)
          const gustStrength = windCycle > 0.2 ? windCycle * 0.008 : 0 // cuma dorong kalo angin cukup kencang
          leaf.vy -= gustStrength

          // ─── Soft boundaries — daun ga keluar viewport ───
          // Bawah: angin dari bawah mulai dorong kalo daun mendekati 75%
          if (leaf.y > vh * 0.7) {
            const depth = (leaf.y - vh * 0.7) / (vh * 0.3)
            leaf.vy -= depth * 0.02 // angin dorong ke atas makin kuat
          }
          // Atas: pelan-pelan dorong turun kalo daun terlalu atas
          if (leaf.y < vh * 0.1) {
            const ceilingDepth = 1 - (leaf.y / (vh * 0.1))
            leaf.vy += ceilingDepth * 0.015
          }

          // Organic vertical drift — breathing
          leaf.vy += organicNoise(t * 0.25, leaf.id === 'A' ? 0 : 5) * 0.003
          // Damping — viscous air
          leaf.vy *= 0.985
          leaf.y += leaf.vy

          // Safety clamp
          if (leaf.y > vh - 20) {
            leaf.y = vh - 20
            leaf.vy = Math.min(0, leaf.vy)
          }
          if (leaf.y < -50) {
            leaf.y = -50
            leaf.vy = Math.max(0, leaf.vy)
          }

          // ─── Horizontal drift ───
          const baseX = leaf.id === 'A' ? vw * 0.25 : vw * 0.75
          const soloX = baseX
          const closeX = togetherX + (leaf.id === 'A' ? -40 : 40)
          const targetBaseX = soloX + (closeX - soloX) * proximity * 0.6

          const sway1 = organicNoise(t * 0.3, leaf.id === 'A' ? 1 : 6) * 25
          const sway2 = organicNoise(t * 0.12, leaf.id === 'A' ? 2 : 7) * 12
          const gust = organicNoise(t * 0.06, 3) * 10 * leaf.swayDirection

          const targetX = targetBaseX + sway1 + sway2 + gust

          leaf.vx += (targetX - leaf.x) * 0.003
          leaf.vx *= 0.97
          leaf.x += leaf.vx

          leaf.x = Math.max(20, Math.min(vw - 40, leaf.x))

          // ─── Rotation ───
          const moveRotation = leaf.vx * 1.5
          const breatheRotation = organicNoise(t * 0.4, leaf.id === 'A' ? 4 : 9) * 4
          leaf.rotationVel += (moveRotation + breatheRotation - leaf.rotationVel) * 0.02
          leaf.rotation += leaf.rotationVel

          // ─── Scale ───
          const forwardDrift = organicNoise(t * 0.2, leaf.id === 'A' ? 3 : 8)
          const targetScale = 0.65 + forwardDrift * 0.2 + proximity * 0.08
          leaf.scale += (targetScale - leaf.scale) * 0.015

          // ─── Opacity ───
          const scaleNorm = (leaf.scale - 0.65) / 0.28
          leaf.opacity = 0.25 + scaleNorm * 0.1 + proximity * 0.08
        }

        // Apply transform — add scroll parallax to Y position
        const displayY = leaf.y + scrollParallax
        const transform = `translate3d(${leaf.x}px, ${displayY}px, 0) rotate(${leaf.rotation}deg) scale(${leaf.scale})`
        leaf.element.style.transform = transform
        leaf.element.style.opacity = String(leaf.opacity)
      })

      // Check if both leaves have united
      if (!leavesUnitedRef.current && closingTriggeredRef.current) {
        const allArrived = leavesRef.current.every(l => l.isClosing && l.closingProgress >= 1)
        if (allArrived) {
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
      aria-hidden="true"
    />
  )
}
