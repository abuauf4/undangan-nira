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

type Tab = 'konten' | 'foto' | 'kehadiran' | 'ucapan'

// Config fields grouped by section
const CONFIG_FIELDS: { key: string; label: string; type: 'text' | 'textarea' | 'json'; group: string }[] = [
  // Mempelai
  { key: 'groom', label: 'Nama Pengantin Pria', type: 'text', group: 'Mempelai' },
  { key: 'bride', label: 'Nama Pengantin Wanita', type: 'text', group: 'Mempelai' },
  { key: 'groomParents', label: 'Orang Tua Pengantin Pria', type: 'text', group: 'Mempelai' },
  { key: 'brideParents', label: 'Orang Tua Pengantin Wanita', type: 'text', group: 'Mempelai' },
  // Acara
  { key: 'akadDate', label: 'Tanggal Akad (ISO)', type: 'text', group: 'Acara' },
  { key: 'resepsiDate', label: 'Tanggal Resepsi (ISO)', type: 'text', group: 'Acara' },
  { key: 'resepsiEnd', label: 'Selesai Resepsi (ISO)', type: 'text', group: 'Acara' },
  { key: 'venue', label: 'Tempat', type: 'text', group: 'Acara' },
  { key: 'address', label: 'Alamat Lengkap', type: 'textarea', group: 'Acara' },
  { key: 'lamaranDate', label: 'Tanggal Lamaran', type: 'text', group: 'Acara' },
  // Cerita
  { key: 'diaryIntro', label: 'Intro Diary', type: 'textarea', group: 'Cerita' },
  { key: 'diarySubtitle', label: 'Subtitle Diary', type: 'text', group: 'Cerita' },
  { key: 'timeline', label: 'Timeline (JSON)', type: 'json', group: 'Cerita' },
  // Closing
  { key: 'closingTitle', label: 'Judul Closing', type: 'textarea', group: 'Closing' },
  { key: 'closingSubtitle', label: 'Subtitle Closing', type: 'textarea', group: 'Closing' },
  { key: 'closingTransliteration', label: 'Transliterasi Doa', type: 'textarea', group: 'Closing' },
  { key: 'closingFooter', label: 'Footer Doa', type: 'textarea', group: 'Closing' },
  { key: 'closingFinal', label: 'Teks Akhir', type: 'textarea', group: 'Closing' },
  { key: 'creditText', label: 'Kredit', type: 'text', group: 'Closing' },
  // Bismillah
  { key: 'bismillahQuote', label: 'Ayat Bismillah', type: 'textarea', group: 'Bismillah' },
  { key: 'bismillahSource', label: 'Sumber Ayat', type: 'text', group: 'Bismillah' },
  // Gallery
  { key: 'galleryCaptions', label: 'Caption Gallery (JSON)', type: 'json', group: 'Gallery' },
]

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('konten')
  const [config, setConfig] = useState<WeddingConfig>({})
  const [editedConfig, setEditedConfig] = useState<WeddingConfig>({})
  const [wishes, setWishes] = useState<Wish[]>([])
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [saving, setSaving] = useState(false)
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
      setConfig(data)
      setEditedConfig(data)
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

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1410' }}>
        <div className="p-8 rounded-2xl border-2 max-w-sm w-full mx-4" style={{ borderColor: 'var(--gold)', background: 'rgba(250,245,230,0.05)' }}>
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

  // Group config fields
  const groups = CONFIG_FIELDS.reduce((acc, f) => {
    if (!acc[f.group]) acc[f.group] = []
    acc[f.group].push(f)
    return acc
  }, {} as Record<string, typeof CONFIG_FIELDS>)

  return (
    <div className="min-h-screen" style={{ background: '#1a1410', color: 'var(--cream)' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[99999] px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--gold)', color: '#1a1410' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b px-4 py-4" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl" style={{ fontFamily: 'var(--font-script)', color: 'var(--gold-light)' }}>
            Undangan Nira — Admin
          </h1>
          <button
            onClick={() => { sessionStorage.removeItem('admin-auth'); setAuthenticated(false) }}
            className="text-xs px-3 py-1.5 rounded border cursor-pointer hover:opacity-80"
            style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b px-4" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {([
            { id: 'konten' as Tab, label: 'Konten' },
            { id: 'foto' as Tab, label: 'Foto' },
            { id: 'kehadiran' as Tab, label: 'Kehadiran' },
            { id: 'ucapan' as Tab, label: `Ucapan${pendingWishes.length > 0 ? ` (${pendingWishes.length})` : ''}` },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-sm cursor-pointer transition-all whitespace-nowrap"
              style={{
                color: activeTab === tab.id ? 'var(--gold)' : 'var(--cream)',
                opacity: activeTab === tab.id ? 1 : 0.5,
                borderBottom: activeTab === tab.id ? '2px solid var(--gold)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* TAB: Konten */}
        {activeTab === 'konten' && (
          <div className="space-y-6">
            {Object.entries(groups).map(([group, fields]) => (
              <div key={group} className="rounded-xl border p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--gold)' }}>{group}</h3>
                <div className="space-y-3">
                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="text-xs mb-1 block" style={{ opacity: 0.6 }}>{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={editedConfig[field.key] || ''}
                          onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-y"
                          style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                        />
                      ) : field.type === 'json' ? (
                        <textarea
                          value={editedConfig[field.key] || ''}
                          onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
                          rows={5}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none font-mono resize-y"
                          style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={editedConfig[field.key] || ''}
                          onChange={(e) => setEditedConfig({ ...editedConfig, [field.key]: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                          style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#1a1410' }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}

        {/* TAB: Foto */}
        {activeTab === 'foto' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ opacity: 0.6 }}>
              Upload foto baru ke folder <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(201,169,110,0.15)' }}>/public/images/</code>
              lalu update nama file di field di bawah.
            </p>
            <div className="rounded-xl border p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--gold)' }}>Daftar Foto</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ opacity: 0.6 }}>Foto Pengantin Pria (groom.jpg)</label>
                  <input
                    type="text"
                    value={editedConfig['photoGroom'] || '/images/groom.jpg'}
                    onChange={(e) => setEditedConfig({ ...editedConfig, photoGroom: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ opacity: 0.6 }}>Foto Pengantin Wanita (bride.jpg)</label>
                  <input
                    type="text"
                    value={editedConfig['photoBride'] || '/images/bride.jpg'}
                    onChange={(e) => setEditedConfig({ ...editedConfig, photoBride: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ opacity: 0.6 }}>Gallery Images (JSON array)</label>
                  <textarea
                    value={editedConfig['galleryImages'] || '[]'}
                    onChange={(e) => setEditedConfig({ ...editedConfig, galleryImages: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono outline-none resize-y"
                    style={{ background: 'rgba(250,245,230,0.08)', borderColor: 'rgba(201,169,110,0.3)', color: 'var(--cream)' }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-6 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#1a1410' }}
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}

        {/* TAB: Kehadiran */}
        {activeTab === 'kehadiran' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>{rsvps.length}</p>
                <p className="text-xs" style={{ opacity: 0.6 }}>Total RSVP</p>
              </div>
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-2xl font-bold" style={{ color: '#4ade80' }}>{attendingCount}</p>
                <p className="text-xs" style={{ opacity: 0.6 }}>Hadir</p>
              </div>
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-2xl font-bold" style={{ color: '#f87171' }}>{rsvps.length - attendingCount}</p>
                <p className="text-xs" style={{ opacity: 0.6 }}>Tidak Hadir</p>
              </div>
              <div className="rounded-xl border p-4 text-center" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--gold-light)' }}>{totalGuests}</p>
                <p className="text-xs" style={{ opacity: 0.6 }}>Total Tamu</p>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(201,169,110,0.2)' }}>
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

        {/* TAB: Ucapan */}
        {activeTab === 'ucapan' && (
          <div className="space-y-6">
            {/* Pending */}
            {pendingWishes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3" style={{ color: '#fbbf24' }}>
                  Menunggu Persetujuan ({pendingWishes.length})
                </h3>
                <div className="space-y-2">
                  {pendingWishes.map(wish => (
                    <div key={wish.id} className="rounded-xl border p-4" style={{ borderColor: 'rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.05)' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--gold)', color: '#1a1410' }}>{wish.avatar}</span>
                            <span className="font-medium text-sm">{wish.name}</span>
                            <span className="text-xs" style={{ opacity: 0.4 }}>{new Date(wish.createdAt).toLocaleDateString('id-ID')}</span>
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
                  <div key={wish.id} className="rounded-xl border p-4" style={{ borderColor: 'rgba(201,169,110,0.2)', background: 'rgba(250,245,230,0.03)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--gold)', color: '#1a1410' }}>{wish.avatar}</span>
                          <span className="font-medium text-sm">{wish.name}</span>
                          <span className="text-xs" style={{ opacity: 0.4 }}>{new Date(wish.createdAt).toLocaleDateString('id-ID')}</span>
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
