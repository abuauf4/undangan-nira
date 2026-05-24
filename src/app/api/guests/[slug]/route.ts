import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guests/[slug] — Fetch guest by slug
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const guest = await db.guest.findUnique({
      where: { slug },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Failed to fetch guest:', error)
    return NextResponse.json({ error: 'Failed to fetch guest' }, { status: 500 })
  }
}

// PATCH /api/guests/[slug] — Update guest by slug
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { name, prefix, suffix, phone } = body

    const existing = await db.guest.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (prefix !== undefined) updateData.prefix = prefix.trim()
    if (suffix !== undefined) updateData.suffix = suffix.trim()
    if (phone !== undefined) updateData.phone = phone.trim()

    const guest = await db.guest.update({
      where: { slug },
      data: updateData,
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Failed to update guest:', error)
    return NextResponse.json({ error: 'Gagal mengupdate tamu' }, { status: 500 })
  }
}

// DELETE /api/guests/[slug] — Delete guest by slug
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const existing = await db.guest.findUnique({ where: { slug } })
    if (!existing) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    await db.guest.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete guest:', error)
    return NextResponse.json({ error: 'Gagal menghapus tamu' }, { status: 500 })
  }
}
