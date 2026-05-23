import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/wishes/[id] — Approve/reject wish
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { approved } = body

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'approved must be boolean' }, { status: 400 })
    }

    const wish = await db.wish.update({
      where: { id },
      data: { approved },
    })

    return NextResponse.json(wish)
  } catch (error) {
    console.error('Failed to update wish:', error)
    return NextResponse.json({ error: 'Failed to update wish' }, { status: 500 })
  }
}

// DELETE /api/wishes/[id] — Delete wish
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.wish.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete wish:', error)
    return NextResponse.json({ error: 'Failed to delete wish' }, { status: 500 })
  }
}
