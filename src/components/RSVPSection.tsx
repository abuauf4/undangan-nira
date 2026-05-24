'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function RSVPSection() {
  const [name, setName] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const sectionRef = useRef<HTMLDivElement>(null)

  // Scroll-triggered entrance animation
  useEffect(() => {
    if (!sectionRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(sectionRef.current!,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current!,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || attending === null) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          attending,
          guests: attending ? guests : 0,
          message: message.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Gagal mengirim konfirmasi')
        setSubmitStatus('error')
        return
      }

      setName('')
      setAttending(null)
      setGuests(1)
      setMessage('')
      setSubmitStatus('success')

      setTimeout(() => setSubmitStatus('idle'), 3000)
    } catch {
      setErrorMsg('Gagal mengirim konfirmasi. Silakan coba lagi.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section ref={sectionRef} data-section="rsvp" className="py-20 px-6 cinema-depth" style={{ background: 'var(--cream)', opacity: 0 }}>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Konfirmasi Kehadiran
        </h2>
        <div className="ornament-divider max-w-xs mx-auto mb-4">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>
        <p className="text-sm mb-8" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
          Mohon konfirmasi kehadiran Anda untuk merencanakan acara dengan baik
        </p>

        {/* ─── RSVP Form ─── */}
        <form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto mb-10 p-6 rounded-xl border border-[var(--gold)]/20 shadow-sm text-left"
          style={{ background: 'rgba(255,255,255,0.7)' }}
        >
          <div className="mb-4">
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
            >
              Nama
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--gold)]/30 text-sm
                focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30
                placeholder:text-[var(--brown-light)]/40 transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--brown)',
                background: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          {/* Attending choice */}
          <div className="mb-4">
            <label
              className="block text-xs font-medium mb-2"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
            >
              Konfirmasi Kehadiran
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAttending(true)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: attending === true
                    ? 'linear-gradient(135deg, var(--gold-dark), var(--gold))'
                    : 'rgba(255,255,255,0.9)',
                  color: attending === true ? 'white' : 'var(--brown)',
                  borderColor: attending === true ? 'var(--gold)' : 'var(--gold)/30',
                }}
              >
                Hadir
              </button>
              <button
                type="button"
                onClick={() => setAttending(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border"
                style={{
                  fontFamily: 'var(--font-body)',
                  background: attending === false
                    ? 'linear-gradient(135deg, var(--brown), var(--brown-light))'
                    : 'rgba(255,255,255,0.9)',
                  color: attending === false ? 'white' : 'var(--brown)',
                  borderColor: attending === false ? 'var(--brown)' : 'var(--gold)/30',
                }}
              >
                Tidak Hadir
              </button>
            </div>
          </div>

          {/* Guest count — only when attending */}
          {attending && (
            <div className="mb-4">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
              >
                Jumlah Tamu
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className="w-9 h-9 rounded-lg border border-[var(--gold)]/30 flex items-center justify-center text-sm
                    hover:border-[var(--gold)] transition-colors"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)', background: 'rgba(255,255,255,0.9)' }}
                >
                  −
                </button>
                <span
                  className="w-10 text-center text-sm font-medium"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
                >
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(Math.min(10, guests + 1))}
                  className="w-9 h-9 rounded-lg border border-[var(--gold)]/30 flex items-center justify-center text-sm
                    hover:border-[var(--gold)] transition-colors"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)', background: 'rgba(255,255,255,0.9)' }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Optional message */}
          <div className="mb-4">
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
            >
              Pesan <span className="opacity-50">(opsional)</span>
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Pesan singkat untuk kedua mempelai..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--gold)]/30 text-sm
                focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30
                placeholder:text-[var(--brown-light)]/40 transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--brown)',
                background: 'rgba(255,255,255,0.9)',
              }}
            />
          </div>

          {/* Status messages */}
          {submitStatus === 'success' && (
            <p className="text-xs mb-3" style={{ color: '#2d6a4f', fontFamily: 'var(--font-body)' }}>
              Terima kasih! Konfirmasi Anda telah terkirim.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="text-xs mb-3" style={{ color: '#c1121f', fontFamily: 'var(--font-body)' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || attending === null}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300
              disabled:opacity-40 disabled:cursor-not-allowed
              hover:shadow-md active:scale-[0.98]"
            style={{
              fontFamily: 'var(--font-body)',
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold))',
              color: 'white',
              border: 'none',
            }}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
          </button>
        </form>

        {/* RSVP list is admin-only — privacy for guests */}
      </div>
    </section>
  )
}
