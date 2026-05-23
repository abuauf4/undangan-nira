import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Match /to/[slug] — personalized guest URL
  // e.g. /to/budi-santoso → internally rewrites to /?guestSlug=budi-santoso
  // Browser URL stays as /to/budi-santoso
  const match = pathname.match(/^\/to\/([a-z0-9-]+)$/)
  if (match) {
    const slug = match[1]
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('guestSlug', slug)
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/to/:slug*',
}
