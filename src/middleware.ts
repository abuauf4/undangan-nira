import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /to/[slug]/story → /?view=story&guestSlug=slug
  const storyMatch = pathname.match(/^\/to\/([a-z0-9-]+)\/story$/)
  if (storyMatch) {
    const slug = storyMatch[1]
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('guestSlug', slug)
    url.searchParams.set('view', 'story')
    return NextResponse.rewrite(url)
  }

  // /to/[slug]/info → /?view=info&guestSlug=slug
  const infoMatch = pathname.match(/^\/to\/([a-z0-9-]+)\/info$/)
  if (infoMatch) {
    const slug = infoMatch[1]
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('guestSlug', slug)
    url.searchParams.set('view', 'info')
    return NextResponse.rewrite(url)
  }

  // /to/[slug] → /?guestSlug=slug (existing)
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
