import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guests/[id] — Fetch guest by slug, code, or id
// The param can be a slug (e.g. "budi-santoso"), a code (e.g. "ABC12345"), or a database id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params

    // Try slug first (most common for public URLs like /budi-santoso)
    let guest = await db.guest.findUnique({ where: { slug: param } })

    // If not a slug, try code (8-char alphanumeric, used in ?guest= query)
    if (!guest) {
      guest = await db.guest.findUnique({ where: { code: param } })
    }

    // If still not found, try database id
    if (!guest) {
      guest = await db.guest.findUnique({ where: { id: param } })
    }

    if (!guest) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Failed to fetch guest:', error)
    return NextResponse.json({ error: 'Failed to fetch guest' }, { status: 500 })
  }
}

// PATCH /api/guests/[id] — Update guest by slug or id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params
    const body = await request.json()
    const { name, prefix, suffix, phone } = body

    // Try slug first, then id
    let existing = await db.guest.findUnique({ where: { slug: param } })
    const whereClause = existing
      ? { slug: param }
      : (await db.guest.findUnique({ where: { id: param } }))
        ? { id: param }
        : null

    if (!whereClause) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (prefix !== undefined) updateData.prefix = prefix.trim()
    if (suffix !== undefined) updateData.suffix = suffix.trim()
    if (phone !== undefined) updateData.phone = phone.trim()

    const guest = await db.guest.update({
      where: whereClause,
      data: updateData,
    })

    return NextResponse.json(guest)
  } catch (error) {
    console.error('Failed to update guest:', error)
    return NextResponse.json({ error: 'Gagal mengupdate tamu' }, { status: 500 })
  }
}

// DELETE /api/guests/[id] — Delete guest by id or slug
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params

    // Try database id first (admin uses id), then slug
    let existing = await db.guest.findUnique({ where: { id: param } })
    if (!existing) {
      existing = await db.guest.findUnique({ where: { slug: param } })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Tamu tidak ditemukan' }, { status: 404 })
    }

    await db.guest.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete guest:', error)
    return NextResponse.json({ error: 'Gagal menghapus tamu' }, { status: 500 })
  }
}
