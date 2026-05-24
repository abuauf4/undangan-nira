import { NextRequest, NextResponse } from 'next/server'

// Password is now server-side only — never exposed to the browser
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nauka2026'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password diperlukan' }, { status: 400 })
    }

    if (password === ADMIN_PASSWORD) {
      // Generate a simple session token (timestamp + random, base64 encoded)
      const token = Buffer.from(
        `${Date.now()}-${Math.random().toString(36).slice(2)}-admin`
      ).toString('base64')

      return NextResponse.json({ success: true, token })
    }

    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// Verify session token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString()
    if (decoded.endsWith('-admin')) {
      return NextResponse.json({ authenticated: true })
    }
  } catch {
    // Invalid token
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
