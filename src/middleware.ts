import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BOT_UA = /bot|crawl|spider|googlebot|bingbot|yandexbot|facebookexternalhit|twitterbot|whatsapp|slack|headless/i

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next()
  }

  const ua = request.headers.get('user-agent') || ''
  if (BOT_UA.test(ua)) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL('/community', request.url))
}

export const config = {
  matcher: '/',
}
