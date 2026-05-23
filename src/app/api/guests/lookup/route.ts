import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guests/lookup?code=XXXX — Find guest by code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const guest = await db.guest.findUnique({ where: { code } })
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }
    return NextResponse.json(guest)
  } catch (error) {
    console.error('Failed to lookup guest:', error)
    return NextResponse.json({ error: 'Failed to lookup guest' }, { status: 500 })
  }
}
