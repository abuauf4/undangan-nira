import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/guests/lookup?slug=xxx or ?code=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const code = searchParams.get('code')

    let guest = null

    if (slug) {
      guest = await db.guest.findUnique({ where: { slug } })
    } else if (code) {
      guest = await db.guest.findUnique({ where: { code } })
    } else {
      return NextResponse.json({ error: 'slug or code is required' }, { status: 400 })
    }

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    return NextResponse.json({
      name: guest.name,
      prefix: guest.prefix,
      suffix: guest.suffix,
      slug: guest.slug,
      code: guest.code,
    })
  } catch (error) {
    console.error('Failed to lookup guest:', error)
    return NextResponse.json({ error: 'Failed to lookup guest' }, { status: 500 })
  }
}
