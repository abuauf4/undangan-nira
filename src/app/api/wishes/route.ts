import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/wishes — Fetch wishes (optionally filter by approved status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')

    const where = approved !== null ? { approved: approved === 'true' } : {}

    const wishes = await db.wish.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(wishes)
  } catch (error) {
    console.error('Failed to fetch wishes:', error)
    return NextResponse.json({ error: 'Failed to fetch wishes' }, { status: 500 })
  }
}

// POST /api/wishes — Submit a new wish
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, message } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nama harus diisi' }, { status: 400 })
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Ucapan harus diisi' }, { status: 400 })
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Nama terlalu panjang' }, { status: 400 })
    }

    if (message.trim().length > 1000) {
      return NextResponse.json({ error: 'Ucapan terlalu panjang' }, { status: 400 })
    }

    // Generate avatar initials from name
    const avatar = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

    // New wishes are auto-approved by default
    const wish = await db.wish.create({
      data: {
        name: name.trim(),
        message: message.trim(),
        avatar,
        approved: true,
      },
    })

    return NextResponse.json(wish, { status: 201 })
  } catch (error) {
    console.error('Failed to create wish:', error)
    return NextResponse.json({ error: 'Gagal mengirim ucapan' }, { status: 500 })
  }
}
