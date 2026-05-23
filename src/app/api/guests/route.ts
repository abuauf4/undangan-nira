import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guests — Fetch all guests, newest first
export async function GET() {
  try {
    const guests = await db.guest.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(guests)
  } catch (error) {
    console.error('Failed to fetch guests:', error)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

// POST /api/guests — Add a new guest (auto-generate unique code)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, prefix, suffix } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nama tamu harus diisi' }, { status: 400 })
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Nama terlalu panjang' }, { status: 400 })
    }

    const validPrefixes = ['', 'Kak', 'Bang', 'Bapak', 'Ibu', 'Mas', 'Mba', 'Dik', 'Pak', 'Bu', 'Tante', 'Om', 'Saudara', 'Saudari']
    const validSuffixes = ['', 'Dan Keluarga', 'Dan Istri', 'Dan Suami', 'Dan Partner']

    const safePrefix = validPrefixes.includes(prefix) ? prefix : ''
    const safeSuffix = validSuffixes.includes(suffix) ? suffix : ''

    // Generate a unique 8-char code (alphanumeric, uppercase)
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing chars (0/O, 1/I/L)
      let code = ''
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    // Try up to 5 times in case of collision
    let code = generateCode()
    let guest = null
    for (let i = 0; i < 5; i++) {
      try {
        guest = await db.guest.create({
          data: {
            name: name.trim(),
            prefix: safePrefix,
            suffix: safeSuffix,
            code,
          },
        })
        break
      } catch {
        code = generateCode()
      }
    }

    if (!guest) {
      return NextResponse.json({ error: 'Gagal membuat kode unik' }, { status: 500 })
    }

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error('Failed to create guest:', error)
    return NextResponse.json({ error: 'Gagal menambahkan tamu' }, { status: 500 })
  }
}
