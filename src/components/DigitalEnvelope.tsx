'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface BankAccount {
  bank: string
  number: string
  name: string
  color: string
  label: string
}

const BANK_ACCOUNTS: BankAccount[] = [
  {
    bank: 'BCA',
    number: '360058289',
    name: 'Anira Tri Agustini',
    color: '#003D79',
    label: 'Mempelai Wanita',
  },
  {
    bank: 'BCA',
    number: '7621009625',
    name: 'Irwan Pratomo',
    color: '#003D79',
    label: 'Mempelai Pria',
  },
]

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

  // Scroll-triggered entrance animation — bank cards stagger in
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

      // Bank cards stagger from left/right
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
  }, [])

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
          Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda kasih, Anda dapat melalui:
        </p>

        {/* ─── Bank Account Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-10">
          {BANK_ACCOUNTS.map((account) => (
            <div
              key={account.number}
              className="rounded-xl overflow-hidden shadow-md border border-[var(--gold)]/20"
              style={{ background: 'rgba(255,255,255,0.85)' }}
            >
              {/* Bank header */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: account.color }}
              >
                <div className="flex flex-col">
                  <span className="text-white text-sm font-bold" style={{ fontFamily: 'var(--font-body)' }}>
                    {account.bank}
                  </span>
                  <span className="text-white/60 text-[9px] tracking-wider uppercase" style={{ fontFamily: 'var(--font-body)' }}>
                    {account.label}
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

        {/* ─── Gift Address ─── */}
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
            Villa Mutiara Bogor 2 Blok C2 No.36<br />
            Kel. Waringin Jaya, Kec. Bojonggede<br />
            Kab. Bogor
          </p>
          <p className="text-xs mt-2 italic" style={{ fontFamily: 'var(--font-body)', color: 'var(--brown-light)' }}>
            a.n. Irwan Pratomo
          </p>
        </div>
      </div>
    </section>
  )
}
