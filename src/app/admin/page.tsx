'use client'

import { useState, useEffect, useCallback } from 'react'

const ADMIN_PASSWORD = 'nauka2026'

interface WeddingConfig {
  [key: string]: string
}

interface Wish {
  id: string
  name: string
  message: string
  avatar: string
  approved: boolean
  createdAt: string
}

interface RSVP {
  id: string
  name: string
  attending: boolean
  guests: number
  message: string
  createdAt: string
}

interface Guest {
  id: string
  name: string
  prefix: string
  suffix: string
  code: string
  createdAt: string
}

type Tab = 'mempelai' | 'acara' | 'cerita' | 'bismillah' | 'amplop' | 'foto' | 'tamu' | 'kehadiran' | 'ucapan'

// Config fields grouped by tab
const CONFIG_FIELDS: { key: string; label: string; type: 'text' | 'textarea' | 'json'; tab: Tab; hint?: string }[] = [
  // Mempelai
  { key: 'groom', label: 'Nama Pengantin Pria', type: 'text', tab: 'mempelai' },
  { key: 'bride', label: 'Nama Pengantin Wanita', type: 'text', tab: 'mempelai' },
  { key: 'groomParents', label: 'Orang Tua Pengantin Pria', type: 'text', tab: 'mempelai' },
  { key: 'brideParents', label: 'Orang Tua Pengantin Wanita', type: 'text', tab: 'mempelai' },
  { key: 'coupleSubtitle', label: 'Subtitle Mempelai (misal: Dua jiwa, satu kisah)', type: 'text', tab: 'mempelai' },
  { key: 'coverSeal', label: 'Seal Monogram (misal: I&A)', type: 'text', tab: 'mempelai' },
  // Acara
  { key: 'akadDate', label: 'Tanggal Akad (ISO)', type: 'text', tab: 'acara', hint: 'Format: 2026-07-05T10:00:00+07:00' },
  { key: 'resepsiDate', label: 'Tanggal Resepsi (ISO)', type: 'text', tab: 'acara', hint: 'Format: 2026-07-05T11:00:00+07:00' },
  { key: 'resepsiEnd', label: 'Selesai Resepsi (ISO)', type: 'text', tab: 'acara' },
  { key: 'venue', label: 'Tempat', type: 'text', tab: 'acara' },
  { key: 'address', label: 'Alamat Lengkap', type: 'textarea', tab: 'acara' },
  { key: 'lamaranDate', label: 'Tanggal Lamaran', type: 'text', tab: 'acara' },
  { key: 'mapsUrl', label: 'Google Maps URL', type: 'text', tab: 'acara' },
  { key: 'mapsQrImage', label: 'QR Code Maps Image Path', type: 'text', tab: 'acara', hint: '/images/maps-qrcode.png' },
  // Cerita
  { key: 'diaryIntroYear', label: 'Tahun Diary Intro (misal: 2020)', type: 'text', tab: 'cerita' },
  { key: 'diarySubtitle', label: 'Subtitle Diary', type: 'text', tab: 'cerita' },
  { key: 'diaryIntro', label: 'Intro Diary (paragraf panjang)', type: 'textarea', tab: 'cerita' },
  { key: 'timeline', label: 'Timeline Cerita (JSON)', type: 'json', tab: 'cerita', hint: '[{"year":"2022","title":"Mulai Dekat","description":"..."}]' },
  { key: 'closingTitle', label: 'Judul Closing', type: 'textarea', tab: 'cerita' },
  { key: 'closingSubtitle', label: 'Subtitle Closing', type: 'textarea', tab: 'cerita' },
  { key: 'closingArabicDoa', label: 'Doa Bahasa Arab', type: 'textarea', tab: 'cerita' },
  { key: 'closingTransliteration', label: 'Transliterasi Doa', type: 'textarea', tab: 'cerita' },
  { key: 'closingFooter', label: 'Footer Doa', type: 'textarea', tab: 'cerita' },
  { key: 'closingFinal', label: 'Teks Akhir', type: 'textarea', tab: 'cerita' },
  { key: 'creditText', label: 'Kredit / Powered By', type: 'text', tab: 'cerita' },
  // Bismillah
  { key: 'bismillahQuote', label: 'Ayat Bismillah (terjemahan)', type: 'textarea', tab: 'bismillah' },
  { key: 'bismillahSource', label: 'Sumber Ayat', type: 'text', tab: 'bismillah' },
  // Amplop Digital
  { key: 'envelopeMessage', label: 'Pesan Amplop Digital', type: 'textarea', tab: 'amplop' },
  { key: 'bankAccounts', label: 'Rekening Bank (JSON)', type: 'json', tab: 'amplop', hint: '[{"bank":"BCA","number":"360058289","name":"Anira Tri Agustini"}]' },
  { key: 'giftAddress', label: 'Alamat Kirim Hadiah', type: 'textarea', tab: 'amplop' },
  { key: 'giftRecipient', label: 'Nama Penerima Hadiah', type: 'text', tab: 'amplop' },
]

// Default values — seed from frontend hardcoded data
const DEFAULT_VALUES: Record<string, string> = {
  groom: 'Irwan Pratomo',
  bride: 'Anira Tri Agustini',
  groomParents: 'Bpk. Sugeng Hartanto & Ibu Dahlianingsih',
  brideParents: 'Bpk. Andi Yosalfi & Ibu Budi Hastuti',
  coupleSubtitle: 'Dua jiwa, satu kisah',
  coverSeal: 'I&A',
  akadDate: '2026-07-05T10:00:00+07:00',
  resepsiDate: '2026-07-05T11:00:00+07:00',
  resepsiEnd: '2026-07-05T17:00:00+07:00',
  venue: 'Rumah Mempelai Wanita',
  address: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  lamaranDate: '31 Agustus 2025',
  mapsUrl: 'https://maps.app.goo.gl/JJ1Lmg33ensJgAvEA?g_st=ac',
  mapsQrImage: '/images/maps-qrcode.png',
  diaryIntroYear: '2020',
  diarySubtitle: 'Cerita kami dimulai',
  diaryIntro: 'Tidak ada yang kebetulan di dunia ini, semua sudah tersusun rapih oleh Sang Maha Kuasa, kita tidak bisa memilih kepada siapa kita akan jatuh cinta, awal kami bertemu pada tahun 2020. Tidak ada yang pernah menyangka bahwa pertemuan itu membawa kami pada suatu ikatan yang suci. Setiap langkah yang kami ambil, setiap tawa dan air mata yang kami bagikan, seolah mengantarkan kami pada satu titik yang telah dituliskan sejak lamanya. Mungkin kami tidak selalu memahami jalan yang kami lalui, tapi kini kami yakin bahwa setiap detik telah menjadi bagian dari cerita ini.',
  timeline: JSON.stringify([
    { year: '2022', title: 'Mulai Dekat', description: 'Seiring berjalan waktu kami semakin dekat. Latar belakang yang berbeda membuat kami saling melengkapi dan banyak menemukan hal baru. Satu dua langkah menuntun kami hingga ke perjalanan selanjutnya.' },
    { year: '2025', title: 'Lamaran', description: 'Kehendak-Nya menuntun kami pada pertemuan yang tak pernah disangka hingga akhirnya membawa kami pada sebuah ikatan suci yang dicintai-Nya, kami melangsungkan acara lamaran pada 31 Agustus 2025.' },
    { year: '2026', title: 'Menikah', description: 'Percayalah, bukan karena bertemu lalu berjodoh, tapi karena berjodohlah kami dipertemukan. Atas izin Allah kami memutuskan untuk mengikrarkan janji suci pernikahan pada 05 Juli 2026.' },
  ], null, 2),
  closingTitle: 'Dan seperti semua cerita indah, kami memulai babak baru bersama.',
  closingSubtitle: 'Terima kasih telah menjadi bagian dari hari bahagia kami.',
  closingArabicDoa: 'بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ',
  closingTransliteration: 'Barakallahu lakuma wa baraka \'alaikuma wa jama\'a bainakuma fi khair.',
  closingFooter: 'Forever starts with Bismillah.',
  closingFinal: 'Cerita kami belum selesai, ini baru permulaan. Sampai jumpa di hari bahagia kami!',
  creditText: 'Powered By Nauka Motion',
  bismillahQuote: '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang."',
  bismillahSource: '— QS. Ar-Rum: 21',
  envelopeMessage: 'Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda bisa mengirimkan melalui:',
  bankAccounts: JSON.stringify([
    { bank: 'BCA', number: '360058289', name: 'Anira Tri Agustini' },
    { bank: 'BCA', number: '7621009625', name: 'Irwan Pratomo' },
  ], null, 2),
  giftAddress: 'Villa Mutiara Bogor 2 Blok C2 No.36, Kel. Waringin Jaya, Kec. Bojonggede, Kab. Bogor',
  giftRecipient: 'Anira Tri Agustini',
  galleryCaptions: JSON.stringify(['Pertama kali', 'Bersama', 'Kenangan', 'Tawa', 'Bahagia'], null, 2),
  galleryImages: JSON.stringify(['/images/gallery-1.jpg', '/images/gallery-2.jpg', '/images/gallery-3.jpg', '/images/gallery-4.jpg', '/images/gallery-5.jpg'], null, 2),
  photoGroom: '/images/groom.jpg',
  photoBride: '/images/bride.jpg',
  coverImage: '/images/hero-poster.jpg',
}

// Helper: get value with fallback
const getVal = (config: WeddingConfig, key: string) => config[key] ?? DEFAULT_VALUES[key] ?? ''

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('mempelai')
  const [config, setConfig] = useState<WeddingConfig>({})
  const [editedConfig, setEditedConfig] = useState<WeddingConfig>({})
  const [wishes, setWishes] = useState<Wish[]>([])
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [newGuestName, setNewGuestName] = useState('')
  const [newGuestPrefix, setNewGuestPrefix] = useState('')
  const [newGuestSuffix, setNewGuestSuffix] = useState('')
  const [addingGuest, setAddingGuest] = useState(false)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [toast, setToast] = useState('')

  // Check sessionStorage for existing auth
  useEffect(() => {
    if (sessionStorage.getItem('admin-auth') === 'true') {
      setAuthenticated(true)
    }
  }, [])

  // Fetch data when authenticated
  useEffect(() => {
    if (!authenticated) return
    fetchConfig()
    fetchWishes()
    fetchRsvps()
    fetchGuests()
  }, [authenticated])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin-auth', 'true')
      setAuthenticated(true)
    } else {
      showToast('Password salah!')
    }
  }

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      // Merge with defaults so all fields have values
      const merged = { ...DEFAULT_VALUES, ...data }
      setConfig(merged)
      setEditedConfig(merged)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchWishes = useCallback(async () => {
    try {
      const res = await fetch('/api/wishes')
      const data = await res.json()
      setWishes(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchRsvps = useCallback(async () => {
    try {
      const res = await fetch('/api/rsvp')
      const data = await res.json()
      setRsvps(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchGuests = useCallback(async () => {
    try {
      const res = await fetch('/api/guests')
      const data = await res.json()
      setGuests(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveConfig = async () => {
    setSaving(true)
    try {
      // Only send changed fields
      const changes: Record<string, string> = {}
      for (const [key, value] of Object.entries(editedConfig)) {
        if (config[key] !== value) {
          changes[key] = value
        }
      }
      if (Object.keys(changes).length === 0) {
        showToast('Tidak ada perubahan')
        setSaving(false)
        return
      }
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (res.ok) {
        setConfig(editedConfig)
        showToast('Berhasil disimpan!')
      } else {
        showToast('Gagal menyimpan')
      }
    } catch {
      showToast('Gagal menyimpan')
    }
    setSaving(false)
  }

  // Seed default values to DB
  const seedDefaults = async () => {
    if (!confirm('Ini akan menyimpan semua nilai default ke database. Lanjutkan?')) return
    setSeeding(true)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_VALUES),
      })
      if (res.ok) {
        await fetchConfig()
        showToast('Data default berhasil disimpan!')
      } else {
        showToast('Gagal menyimpan data default')
      }
    } catch {
      showToast('Gagal menyimpan data default')
    }
    setSeeding(false)
  }

  const approveWish = async (id: string, approved: boolean) => {
    try {
      await fetch(`/api/wishes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      })
      setWishes(wishes.map(w => w.id === id ? { ...w, approved } : w))
    } catch {
      showToast('Gagal mengubah status')
    }
  }

  const deleteWish = async (id: string) => {
    if (!confirm('Hapus ucapan ini?')) return
    try {
      await fetch(`/api/wishes/${id}`, { method: 'DELETE' })
      setWishes(wishes.filter(w => w.id !== id))
      showToast('Ucapan dihapus')
    } catch {
      showToast('Gagal menghapus')
    }
  }

  const addGuest = async () => {
    if (!newGuestName.trim()) return
    setAddingGuest(true)
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGuestName.trim(), prefix: newGuestPrefix, suffix: newGuestSuffix }),
      })
      if (res.ok) {
        const guest = await res.json()
        setGuests([guest, ...guests])
        setNewGuestName('')
        setNewGuestPrefix('')
        setNewGuestSuffix('')
        showToast('Tamu ditambahkan!')
      } else {
        showToast('Gagal menambahkan tamu')
      }
    } catch {
      showToast('Gagal menambahkan tamu')
    }
    setAddingGuest(false)
  }

  const deleteGuest = async (id: string) => {
    if (!confirm('Hapus tamu ini?')) return
    try {
      await fetch(`/api/guests/${id}`, { method: 'DELETE' })
      setGuests(guests.filter(g => g.id !== id))
      showToast('Tamu dihapus')
    } catch {
      showToast('Gagal menghapus')
    }
  }

  const getGuestLink = (code: string) => {
    const base = window.location.origin
    return `${base}?guest=${code}`
  }

  const copyGuestLink = async (code: string) => {
    const link = getGuestLink(code)
    try {
      await navigator.clipboard.writeText(link)
      showToast('Link disalin!')
    } catch {
      showToast('Gagal menyalin link')
    }
  }

  const getGuestDisplayName = (guest: Guest) => {
    const parts = []
    if (guest.prefix) parts.push(guest.prefix)
    parts.push(guest.name)
    if (guest.suffix) parts.push(guest.suffix)
    return parts.join(' ')
  }

  const shareWhatsApp = (guest: Guest) => {
    const link = getGuestLink(guest.code)
    const displayName = getGuestDisplayName(guest)
    const groomName = getVal(editedConfig, 'groom')
    const brideName = getVal(editedConfig, 'bride')
    const message = `Assalamu'alaikum ${displayName} 🤍\n\nKami mengundang Anda dengan penuh sukacita untuk hadir dalam acara pernikahan kami.\n\n${groomName} & ${brideName}\n05 Juli 2026\n\n📎 Buka undangan Anda di:\n${link}\n\nMerupakan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.\n\nTerima kasih 🙏✨`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  // Helper to render a config field
  const renderField = (fieldKey: string) => {
    const field = CONFIG_FIELDS.find(f => f.key === fieldKey)
    if (!field) return null
    const value = getVal(editedConfig, field.key)
    return (
      <div key={field.key}>
        <label className="text-xs mb-1 block" style={{ opacity: 0.6 }}>{field.label}</label>
        {field.hint && <p className="text-[10px] mb-1" style={{ opacity: 0.35 }}>{field.hint}</p>}
        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
            style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
          />
        ) : field.type === 'json' ? (
          <textarea
            value={value}
            onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono resize-y"
            style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
          />
        )}
      </div>
    )
  }

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1410' }}>
        <div className="p-6 sm:p-8 rounded-2xl border-2 max-w-sm w-full" style={{ borderColor: 'var(--gold)', background: 'rgba(250,245,230,0.05)' }}>
          <h1 className="text-2xl mb-2 text-center" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)' }}>
            Admin Panel
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--cream)', opacity: 0.6 }}>
            Masukkan password untuk mengakses
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border text-sm outline-none focus:ring-2"
            style={{ background: 'rgba(250,245,230,0.1)', borderColor: 'var(--gold)', color: 'var(--cream)' }}
          />
          <button
            onClick={handleLogin}
            className="w-full mt-4 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'var(--gold)', color: '#1a1410' }}
          >
            Masuk
          </button>
        </div>
      </div>
    )
  }

  const pendingWishes = wishes.filter(w => !w.approved)
  const approvedWishes = wishes.filter(w => w.approved)
  const attendingCount = rsvps.filter(r => r.attending).length
  const totalGuests = rsvps.filter(r => r.attending).reduce((sum, r) => sum + r.guests, 0)

  // Group config fields by current tab
  const tabFields = CONFIG_FIELDS.filter(f => f.tab === activeTab)

  const tabs: { id: Tab; label: string; icon?: string }[] = [
    { id: 'mempelai', label: 'Mempelai', icon: '💑' },
    { id: 'acara', label: 'Acara', icon: '📅' },
    { id: 'cerita', label: 'Cerita', icon: '📖' },
    { id: 'bismillah', label: 'Bismillah', icon: '☪' },
    { id: 'amplop', label: 'Amplop', icon: '💌' },
    { id: 'foto', label: 'Foto', icon: '📷' },
    { id: 'tamu', label: `Tamu${guests.length > 0 ? ` (${guests.length})` : ''}`, icon: '👥' },
    { id: 'kehadiran', label: 'Hadir', icon: '✓' },
    { id: 'ucapan', label: `Ucapan${pendingWishes.length > 0 ? ` (${pendingWishes.length})` : ''}`, icon: '💬' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#1a1410', color: 'var(--cream)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-[99999] px-4 py-2 rounded-lg text-sm text-center sm:text-left" style={{ background: 'var(--gold)', color: '#1a1410' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b px-3 sm:px-4 py-3 sm:py-4" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-base sm:text-xl truncate" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)' }}>
            Undangan Nira — Admin
          </h1>
          <button
            onClick={() => { sessionStorage.removeItem('admin-auth'); setAuthenticated(false) }}
            className="text-xs px-3 py-1.5 rounded border cursor-pointer hover:opacity-80 flex-shrink-0 ml-2"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="border-b px-2 sm:px-4" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
        <div className="max-w-6xl mx-auto flex gap-0 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer transition-all whitespace-nowrap flex-shrink-0"
              style={{
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--cream)',
                opacity: activeTab === tab.id ? 1 : 0.5,
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              <span className="sm:hidden">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden ml-1">{tab.label.length > 6 ? '' : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-3 sm:p-4">

        {/* ─── CONFIG TABS (Mempelai, Acara, Cerita, Bismillah, Amplop, Foto) ─── */}
        {['mempelai', 'acara', 'cerita', 'bismillah', 'amplop', 'foto'].includes(activeTab) && (
          <div className="space-y-4">
            {/* Seed button */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs" style={{ opacity: 0.4 }}>Edit konten undangan di bawah. Perubahan otomatis tersimpan ke database.</p>
              <button
                onClick={seedDefaults}
                disabled={seeding}
                className="text-xs px-3 py-1.5 rounded border cursor-pointer hover:opacity-80 disabled:opacity-50 flex-shrink-0"
                style={{ borderColor: 'rgba(201,169,110,0.3)', color: 'var(--gold)' }}
              >
                {seeding ? 'Menyimpan...' : 'Seed Default Data'}
              </button>
            </div>

            {/* Fields */}
            <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
              <div className="space-y-3">
                {tabFields.map(field => renderField(field.key))}
              </div>
            </div>

            {/* Foto tab extra */}
            {activeTab === 'foto' && (
              <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--gold)' }}>Foto Tambahan</h3>
                <div className="space-y-3">
                  {renderField('photoGroom')}
                  {renderField('photoBride')}
                  {renderField('coverImage')}
                  {renderField('galleryImages')}
                  {renderField('galleryCaptions')}
                </div>
              </div>
            )}

            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#1a1410' }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}

        {/* ─── TAB: Tamu ─── */}
        {activeTab === 'tamu' && (
          <div className="space-y-4">
            {/* Add guest input */}
            <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--gold)' }}>Tambah Tamu</h3>
              <div className="space-y-2">
                {/* Row 1: Prefix + Name */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newGuestPrefix}
                    onChange={(e) => setNewGuestPrefix(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border text-sm outline-none cursor-pointer w-full sm:w-auto"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)', minWidth: '100px' }}
                  >
                    <option value="" style={{ background: '#1a1410' }}>Tanpa</option>
                    <option value="Kak" style={{ background: '#1a1410' }}>Kak</option>
                    <option value="Bang" style={{ background: '#1a1410' }}>Bang</option>
                    <option value="Mas" style={{ background: '#1a1410' }}>Mas</option>
                    <option value="Mba" style={{ background: '#1a1410' }}>Mba</option>
                    <option value="Dik" style={{ background: '#1a1410' }}>Dik</option>
                    <option value="Bapak" style={{ background: '#1a1410' }}>Bapak</option>
                    <option value="Ibu" style={{ background: '#1a1410' }}>Ibu</option>
                    <option value="Pak" style={{ background: '#1a1410' }}>Pak</option>
                    <option value="Bu" style={{ background: '#1a1410' }}>Bu</option>
                    <option value="Tante" style={{ background: '#1a1410' }}>Tante</option>
                    <option value="Om" style={{ background: '#1a1410' }}>Om</option>
                    <option value="Saudara" style={{ background: '#1a1410' }}>Saudara</option>
                    <option value="Saudari" style={{ background: '#1a1410' }}>Saudari</option>
                  </select>
                  <input
                    type="text"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                    placeholder="Nama tamu (misal: Budi Santoso)"
                    className="flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                  />
                </div>
                {/* Row 2: Suffix */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newGuestSuffix}
                    onChange={(e) => setNewGuestSuffix(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border text-sm outline-none cursor-pointer w-full sm:w-auto"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)', minWidth: '160px' }}
                  >
                    <option value="" style={{ background: '#1a1410' }}>Tanpa Suffix</option>
                    <option value="Dan Keluarga" style={{ background: '#1a1410' }}>Dan Keluarga</option>
                    <option value="Dan Istri" style={{ background: '#1a1410' }}>Dan Istri</option>
                    <option value="Dan Suami" style={{ background: '#1a1410' }}>Dan Suami</option>
                    <option value="Dan Partner" style={{ background: '#1a1410' }}>Dan Partner</option>
                  </select>
                  <div className="text-xs px-1 flex items-center" style={{ color: 'var(--gold-light)', opacity: 0.6 }}>
                    Preview: {newGuestPrefix && <span>{newGuestPrefix} </span>}{newGuestName || 'Nama Tamu'}{newGuestSuffix && <span> {newGuestSuffix}</span>}
                  </div>
                </div>
                <button
                  onClick={addGuest}
                  disabled={addingGuest || !newGuestName.trim()}
                  className="w-full px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--gold)', color: '#1a1410' }}
                >
                  {addingGuest ? 'Menambahkan...' : 'Tambah Tamu'}
                </button>
              </div>
            </div>

            {/* Guest list — card layout on mobile, table on desktop */}
            <div className="rounded-xl border overflow-hidden hidden sm:block" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.1)' }}>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Nama</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Kode</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Link</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map(guest => (
                      <tr key={guest.id} className="border-t" style={{ borderColor: 'rgba(201,169,110,0.1)' }}>
                        <td className="px-4 py-3 font-medium">
                          {guest.prefix && <span style={{ color: 'var(--gold-light)', opacity: 0.7 }}>{guest.prefix} </span>}
                          {guest.name}
                          {guest.suffix && <span style={{ color: 'var(--gold-light)', opacity: 0.7 }}> {guest.suffix}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <code className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold-light)' }}>{guest.code}</code>
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate" style={{ opacity: 0.7, fontSize: '11px' }}>
                          {getGuestLink(guest.code)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => copyGuestLink(guest.code)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: 'rgba(201,169,110,0.2)', color: 'var(--gold-light)' }} title="Salin link">Salin</button>
                            <button onClick={() => shareWhatsApp(guest)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: '#25D366', color: 'white' }} title="Bagikan via WhatsApp">WhatsApp</button>
                            <button onClick={() => deleteGuest(guest.id)} className="px-2 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }} title="Hapus">✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {guests.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ opacity: 0.4 }}>Belum ada tamu. Tambahkan nama tamu di atas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: Card layout */}
            <div className="space-y-2 sm:hidden">
              {guests.map(guest => (
                <div key={guest.id} className="rounded-xl border p-3" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        {guest.prefix && <span style={{ color: 'var(--gold-light)', opacity: 0.7 }}>{guest.prefix} </span>}
                        {guest.name}
                        {guest.suffix && <span style={{ color: 'var(--gold-light)', opacity: 0.7 }}> {guest.suffix}</span>}
                      </p>
                      <code className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--gold-light)' }}>{guest.code}</code>
                    </div>
                    <button onClick={() => deleteGuest(guest.id)} className="px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 flex-shrink-0" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>✕</button>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => copyGuestLink(guest.code)} className="flex-1 py-1.5 rounded text-xs cursor-pointer hover:opacity-80 text-center" style={{ background: 'rgba(201,169,110,0.2)', color: 'var(--gold-light)' }}>Salin Link</button>
                    <button onClick={() => shareWhatsApp(guest)} className="flex-1 py-1.5 rounded text-xs cursor-pointer hover:opacity-80 text-center" style={{ background: '#25D366', color: 'white' }}>WhatsApp</button>
                  </div>
                </div>
              ))}
              {guests.length === 0 && (
                <p className="text-sm text-center py-8" style={{ opacity: 0.4 }}>Belum ada tamu.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: Kehadiran ─── */}
        {activeTab === 'kehadiran' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="rounded-xl border p-3 sm:p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--gold)' }}>{rsvps.length}</p>
                <p className="text-[10px] sm:text-xs" style={{ opacity: 0.6 }}>Total RSVP</p>
              </div>
              <div className="rounded-xl border p-3 sm:p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: '#4ade80' }}>{attendingCount}</p>
                <p className="text-[10px] sm:text-xs" style={{ opacity: 0.6 }}>Hadir</p>
              </div>
              <div className="rounded-xl border p-3 sm:p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: '#f87171' }}>{rsvps.length - attendingCount}</p>
                <p className="text-[10px] sm:text-xs" style={{ opacity: 0.6 }}>Tidak Hadir</p>
              </div>
              <div className="rounded-xl border p-3 sm:p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--gold-light)' }}>{totalGuests}</p>
                <p className="text-[10px] sm:text-xs" style={{ opacity: 0.6 }}>Total Tamu</p>
              </div>
            </div>

            {/* Mobile: Card layout */}
            <div className="space-y-2 sm:hidden">
              {rsvps.map(rsvp => (
                <div key={rsvp.id} className="rounded-xl border p-3" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{rsvp.name}</p>
                    <span className="px-2 py-0.5 rounded text-[10px]" style={{ background: rsvp.attending ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)', color: rsvp.attending ? '#4ade80' : '#f87171' }}>
                      {rsvp.attending ? 'Hadir' : 'Tidak Hadir'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ opacity: 0.5 }}>{rsvp.guests} tamu • {new Date(rsvp.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  {rsvp.message && <p className="text-xs mt-1" style={{ opacity: 0.6 }}>{rsvp.message}</p>}
                </div>
              ))}
              {rsvps.length === 0 && <p className="text-sm text-center py-8" style={{ opacity: 0.4 }}>Belum ada RSVP</p>}
            </div>

            {/* Desktop: Table */}
            <div className="rounded-xl border overflow-hidden hidden sm:block" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(201,169,110,0.1)' }}>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Nama</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Kehadiran</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Jumlah</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Pesan</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--gold)' }}>Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map(rsvp => (
                      <tr key={rsvp.id} className="border-t" style={{ borderColor: 'rgba(201,169,110,0.1)' }}>
                        <td className="px-4 py-3">{rsvp.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: rsvp.attending ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)', color: rsvp.attending ? '#4ade80' : '#f87171' }}>
                            {rsvp.attending ? 'Hadir' : 'Tidak Hadir'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{rsvp.guests}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" style={{ opacity: 0.7 }}>{rsvp.message || '-'}</td>
                        <td className="px-4 py-3 text-xs" style={{ opacity: 0.5 }}>{new Date(rsvp.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))}
                    {rsvps.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ opacity: 0.4 }}>Belum ada RSVP</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: Ucapan ─── */}
        {activeTab === 'ucapan' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Pending */}
            {pendingWishes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: '#fbbf24' }}>
                  Menunggu Persetujuan ({pendingWishes.length})
                </h3>
                <div className="space-y-2">
                  {pendingWishes.map(wish => (
                    <div key={wish.id} className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--gold)', color: '#1a1410' }}>{wish.avatar}</span>
                            <span className="font-medium text-sm">{wish.name}</span>
                            <span className="text-[10px]" style={{ opacity: 0.4 }}>{new Date(wish.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <p className="text-sm" style={{ opacity: 0.8 }}>{wish.message}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => approveWish(wish.id, true)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: '#4ade80', color: '#1a1410' }}>Setujui</button>
                          <button onClick={() => deleteWish(wish.id)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: '#f87171', color: '#1a1410' }}>Hapus</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved */}
            <div>
              <h3 className="text-sm font-medium mb-3" style={{ color: '#4ade80' }}>
                Disetujui ({approvedWishes.length})
              </h3>
              <div className="space-y-2">
                {approvedWishes.map(wish => (
                  <div key={wish.id} className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--gold)', color: '#1a1410' }}>{wish.avatar}</span>
                          <span className="font-medium text-sm">{wish.name}</span>
                          <span className="text-[10px]" style={{ opacity: 0.4 }}>{new Date(wish.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="text-sm" style={{ opacity: 0.8 }}>{wish.message}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => approveWish(wish.id, false)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80 border" style={{ borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24' }}>Tolak</button>
                        <button onClick={() => deleteWish(wish.id)} className="px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171' }}>Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
                {approvedWishes.length === 0 && (
                  <p className="text-sm text-center py-8" style={{ opacity: 0.4 }}>Belum ada ucapan yang disetujui</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
