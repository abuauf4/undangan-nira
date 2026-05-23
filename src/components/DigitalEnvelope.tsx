'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300
        hover:shadow-sm active:scale-[0.97]"
      style={{
        fontFamily: 'var(--font-body)',
        background: copied ? '#2d6a4f' : 'rgba(255,255,255,0.9)',
        color: copied ? 'white' : 'var(--brown)',
        border: copied ? '1px solid #2d6a4f' : '1px solid var(--gold)/30',
      }}
    >
      {copied ? 'Tersalin!' : 'Salin'}
    </button>
  )
}

export default function DigitalEnvelope() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [bankAccounts, setBankAccounts] = useState<{ bank: string; number: string; name: string }[]>([])
  const [envelopeMessage, setEnvelopeMessage] = useState('')
  const [giftAddress, setGiftAddress] = useState('')
  const [giftRecipient, setGiftRecipient] = useState('')

  // Fetch config from API
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        if (data.bankAccounts) {
          try { setBankAccounts(JSON.parse(data.bankAccounts)) } catch {}
        }
        if (data.envelopeMessage) setEnvelopeMessage(data.envelopeMessage)
        if (data.giftAddress) setGiftAddress(data.giftAddress)
        if (data.giftRecipient) setGiftRecipient(data.giftRecipient)
      })
      .catch(() => {})
  }, [])

  // Bank colors
  const bankColors: Record<string, string> = {
    BCA: '#8B5E3C',
    BNI: '#5C4A32',
    BRI: '#6B4423',
    Mandiri: '#3D5A80',
    default: '#5C4A32',
  }
  const bankLabels = ['Mempelai Wanita', 'Mempelai Pria']

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

      const cards = sectionRef.current!.querySelectorAll('.grid > div')
      if (cards.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current!,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
          }
        )
      }
    })
    return () => ctx.revert()
  }, [bankAccounts])

  return (
    <section ref={sectionRef} data-section="envelope" className="py-20 px-6" style={{ background: 'var(--cream-dark)', opacity: 0 }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-dark)' }}>
          Amplop Digital
        </h2>
        <div className="ornament-divider max-w-xs mx-auto mb-4">
          <span className="text-[var(--gold)] text-lg">&#10047;</span>
        </div>
        <p className="text-sm mb-10 max-w-md mx-auto" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
          {envelopeMessage || 'Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih, Anda dapat melalui:'}
        </p>

        {/* ─── Bank Account Cards ─── */}
        {bankAccounts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-10">
            {bankAccounts.map((account, i) => (
              <div
                key={account.number}
                className="rounded-xl overflow-hidden shadow-md border border-[var(--gold)]/20"
                style={{ background: 'rgba(255,255,255,0.85)' }}
              >
                {/* Bank header */}
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ background: bankColors[account.bank] || bankColors.default }}
                >
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>
                      {account.bank}
                    </span>
                    <span className="text-white/60 text-[9px] tracking-wider uppercase" style={{ fontFamily: 'var(--font-body)' }}>
                      {bankLabels[i] || `Rekening ${i + 1}`}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <span className="text-white/80 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                      {account.bank[0]}
                    </span>
                  </div>
                </div>

                {/* Account details */}
                <div className="p-5 text-left">
                  <p className="text-xs mb-1 opacity-60" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
                    Nomor Rekening
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-lg font-bold tracking-wider"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}
                    >
                      {account.number}
                    </p>
                    <CopyButton text={account.number} />
                  </div>
                  <p className="text-xs opacity-60" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
                    a.n.
                  </p>
                  <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
                    {account.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Gift Address ─── */}
        {giftAddress && (
          <div
            className="max-w-md mx-auto p-6 rounded-xl border border-[var(--gold)]/20 shadow-sm"
            style={{ background: 'rgba(255,255,255,0.6)' }}
          >
            <div className="flex items-center justify-center mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
              <span className="mx-3 text-[var(--gold)] text-sm">&#9993;</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent" />
            </div>

            <h3 className="text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
              Kirim Hadiah
            </h3>
            <p className="text-xs leading-relaxed mb-3" style={{ fontFamily: 'var(--font-serif)', color: 'var(--brown-light)' }}>
              Jika ingin mengirimkan hadiah fisik, silakan kirim ke alamat berikut:
            </p>
            <p className="text-xs leading-relaxed italic" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown)' }}>
              {giftAddress}
            </p>
            {giftRecipient && (
              <p className="text-xs mt-2 italic" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}>
                a.n. {giftRecipient}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
