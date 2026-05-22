'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface Wish {
  id: string
  name: string
  message: string
  avatar: string
  createdAt: string
}

function WishCard({ wish, index }: { wish: Wish; index: number }) {
  return (
    <div
      className="wish-card rounded-xl p-5 border border-[var(--gold)]/30 shadow-sm
        hover:shadow-md hover:border-[var(--gold)]/50 transition-all duration-300 text-left"
      style={{
        background: 'rgba(255,255,255,0.85)',
        animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
      }}
    >
      <div className="flex items-center justify-center mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
        <span className="mx-2 text-[var(--gold)] text-xs opacity-60">&#10047;</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
      </div>

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium border border-[var(--gold)]/30"
          style={{ background: 'var(--cream)', color: 'var(--gold-dark)', fontFamily: 'var(--font-body)' }}
        >
          {wish.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
            {wish.name}
          </p>
          <p className="text-sm leading-relaxed italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
            &ldquo;{wish.message}&rdquo;
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center mt-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold)]/50 to-transparent" />
      </div>
    </div>
  )
}

export default function GuestWishes() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [name, setName] = useState('')
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
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  // Fetch approved wishes from API on mount
  const fetchWishes = useCallback(async () => {
    try {
      const res = await fetch('/api/wishes?approved=true')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setWishes(data)
        }
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchWishes()
  }, [fetchWishes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMsg('')

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Gagal mengirim ucapan')
        setSubmitStatus('error')
        return
      }

      const newWish = await res.json()
      setWishes(prev => [newWish, ...prev])
      setName('')
      setMessage('')
      setSubmitStatus('success')

      // Clear success message after 3s
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } catch {
      setErrorMsg('Gagal mengirim ucapan. Silakan coba lagi.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section ref={sectionRef} data-section="wishes" className="py-20 px-6" style={{ background: 'var(--cream-dark)', opacity: 0 }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Ucapan & Doa
        </h2>
        <div className="ornament-divider max-w-xs mx-auto mb-4">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>
        <p className="text-sm mb-8" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
          Berikan doa dan ucapan untuk kedua mempelai
        </p>

        {/* ─── Input Form ─── */}
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

          <div className="mb-4">
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
            >
              Ucapan & Doa
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis ucapan dan doa Anda untuk kedua mempelai..."
              required
              maxLength={1000}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--gold)]/30 text-sm
                focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/30
                placeholder:text-[var(--brown-light)]/40 transition-colors resize-none"
              style={{
                fontFamily: 'var(--font-serif)',
                color: 'var(--brown)',
                background: 'rgba(255,255,255,0.9)',
                fontStyle: 'italic',
              }}
            />
          </div>

          {/* Status messages */}
          {submitStatus === 'success' && (
            <p className="text-xs mb-3" style={{ color: '#2d6a4f', fontFamily: 'var(--font-body)' }}>
              Terima kasih! Ucapan Anda telah terkirim.
            </p>
          )}
          {submitStatus === 'error' && (
            <p className="text-xs mb-3" style={{ color: '#c1121f', fontFamily: 'var(--font-body)' }}>
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !message.trim()}
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
            {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
          </button>
        </form>

        {/* ─── Wishes List — no nested scroll container ─── */}
        {wishes.length > 0 ? (
          <div className="max-w-lg mx-auto space-y-3">
            {wishes.map((wish, index) => (
              <WishCard key={wish.id} wish={wish} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-sm italic" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
            Belum ada ucapan. Jadilah yang pertama!
          </p>
        )}
      </div>
    </section>
  )
}
