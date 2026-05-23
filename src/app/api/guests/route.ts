import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Slug generation helper — from name to URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')        // spaces → hyphens
    .replace(/-+/g, '-')         // multiple hyphens → single
    .replace(/^-|-$/g, '')       // trim leading/trailing hyphens
}

// Generate unique slug by checking DB
async function getUniqueSlug(name: string): Promise<string> {
  const baseSlug = generateSlug(name)
  if (!baseSlug) return `guest-${Date.now()}`
  let slug = baseSlug
  let counter = 2
  while (true) {
    const existing = await db.guest.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${baseSlug}-${counter}`
    counter++
  }
  return slug
}

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

// POST /api/guests — Add a new guest (auto-generate unique code + slug)
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

    // Generate unique slug from name
    const slug = await getUniqueSlug(name.trim())

    // Generate a unique 8-char code (alphanumeric, uppercase)
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
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
            slug,
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

// DELETE /api/guests?id=xxx — Delete a guest
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })
    }
    await db.guest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete guest:', error)
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
  }
}
