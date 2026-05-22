import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/config — Fetch all wedding config as flat object
export async function GET() {
  try {
    const configs = await db.weddingConfig.findMany()
    const result: Record<string, string> = {}
    configs.forEach((c) => {
      result[c.key] = c.value
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch config:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// POST /api/config — Update one or more config values
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const updates = Object.entries(body) as [string, string][]

    for (const [key, value] of updates) {
      if (typeof key !== 'string' || typeof value !== 'string') continue
      await db.weddingConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
