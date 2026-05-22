'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface MusicPlayerProps {
  isPlaying: boolean
  onToggle: () => void
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export default function MusicPlayer({ isPlaying, onToggle, audioRef }: MusicPlayerProps) {
  const [expanded, setExpanded] = useState(false)
  const [visualizerBars] = useState(() =>
    Array.from({ length: 12 }, () => ({
      height: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.8 + 0.6,
      delay: Math.random() * 0.5,
    }))
  )

  // Fade audio in when user plays — only handles user-initiated play
  // Closing section handles its own fade-out via IntersectionObserver
  // so we only fade IN here, not out (to avoid race condition with closing fade)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.volume = 0
      const fadeIn = setInterval(() => {
        if (audio.volume < 0.9) {
          audio.volume = Math.min(audio.volume + 0.1, 1)
        } else {
          audio.volume = 1
          clearInterval(fadeIn)
        }
      }, 30)
      return () => clearInterval(fadeIn)
    }
    // No fade-out here — closing section handles its own fade
    // If user manually pauses, instant stop is fine
  }, [isPlaying, audioRef])

  // Portal: render directly to <body> so the button is always visible
  // regardless of any transforms/filters/z-index issues from parent elements
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const musicUI = (
    <>
      {/* Mini floating button - always visible on screen */}
      <button
        onClick={() => {
          onToggle()
          if (!isPlaying) setExpanded(true)
        }}
        className={`fixed bottom-6 right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center
          shadow-[0_0_20px_rgba(201,169,110,0.3)] transition-all duration-300 cursor-pointer music-pulse
          hover:shadow-[0_0_30px_rgba(201,169,110,0.5)] hover:scale-110 ${isPlaying ? 'playing' : ''}`}
        style={{ background: 'rgba(250, 245, 230, 0.95)', color: 'var(--gold-dark)', backdropFilter: 'blur(8px)', position: 'fixed', zIndex: 999999 }}
        title={isPlaying ? 'Matikan Musik' : 'Putar Musik'}
      >
        {isPlaying ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        )}
      </button>

      {/* Expanded player panel */}
      <div
        className={`fixed bottom-24 right-6 transition-all duration-500 ${
          expanded && isPlaying
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ position: 'fixed', zIndex: 999999 }}
      >
        <div
          className="w-72 rounded-2xl border-2 border-[var(--gold)]/40 shadow-2xl overflow-hidden"
          style={{ background: 'var(--cream)' }}
        >
          {/* Header with vinyl */}
          <div className="relative p-4 pb-3 flex items-center gap-4" style={{ background: 'var(--cream-dark)' }}>
            {/* Vinyl record */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-full ${isPlaying ? 'animate-rotate-slow' : ''}`}
                style={{
                  background: `
                    radial-gradient(circle at 50% 50%, 
                      var(--gold-dark) 0%, var(--gold-dark) 12%, 
                      transparent 12%, transparent 14%,
                      #2a2a2a 14%, #2a2a2a 16%,
                      #333 16%, #333 30%,
                      #2a2a2a 30%, #2a2a2a 32%,
                      #333 32%, #333 45%,
                      #2a2a2a 45%, #2a2a2a 47%,
                      #333 47%, #333 60%,
                      #2a2a2a 60%, #2a2a2a 62%,
                      #333 62%, #333 75%,
                      #2a2a2a 75%, #2a2a2a 77%,
                      #333 77%, #333 100%
                    )
                  `,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {/* Center label */}
                <div
                  className="absolute inset-0 m-auto w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--gold)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brown)]" />
                </div>
              </div>
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
                Gamelan Jawa
              </p>
              <p className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
                Traditional Javanese Music
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {/* Pulsing indicator */}
                <span
                  className={`w-2 h-2 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
                  style={{ background: isPlaying ? '#4ade80' : 'var(--brown-light)' }}
                />
                <span className="text-[10px] tracking-wider uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}>
                  {isPlaying ? 'Now Playing' : 'Paused'}
                </span>
              </div>
            </div>
          </div>

          {/* Visualizer bars */}
          <div className="px-4 py-3 flex items-end justify-center gap-[3px] h-10" style={{ background: 'var(--cream)' }}>
            {visualizerBars.map((bar, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all"
                style={{
                  background: isPlaying
                    ? `linear-gradient(to top, var(--gold-dark), var(--gold-light))`
                    : 'var(--gold-dark)',
                  height: isPlaying ? `${bar.height * 100}%` : '20%',
                  animation: isPlaying
                    ? `visualizerBar ${bar.speed}s ease-in-out ${bar.delay}s infinite alternate`
                    : 'none',
                  opacity: isPlaying ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] tracking-wider uppercase px-2 py-1 rounded hover:bg-[var(--gold)]/10 transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}
            >
              Minimize
            </button>
            <button
              onClick={onToggle}
              className="px-4 py-1.5 rounded-full border border-[var(--gold)] text-xs tracking-wider uppercase
                hover:bg-[var(--gold)] hover:text-white transition-all duration-300 cursor-pointer"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(musicUI, document.body)
}
