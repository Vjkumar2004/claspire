import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BOT_UA = /bot|crawl|spider|googlebot|bingbot|yandexbot|facebookexternalhit|twitterbot|whatsapp|slack|headless/i

// API burst rate limit: 30 requests per 10 seconds per IP
const API_BURST_LIMIT = 30
const API_BURST_WINDOW = 10 // seconds

// Simple in-memory store for burst protection (per-process; resets on restart)
const burstStore = new Map<string, { count: number; windowStart: number }>()

function checkBurstLimit(ip: string): boolean {
  const now = Date.now()
  const entry = burstStore.get(ip)

  if (!entry || now - entry.windowStart > API_BURST_WINDOW * 1000) {
    burstStore.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= API_BURST_LIMIT) {
    return false
  }

  entry.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply burst protection to all API routes
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1'

    if (!checkBurstLimit(ip)) {
      return new NextResponse(JSON.stringify({
        error: 'Too many requests. Please slow down.',
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return NextResponse.next()
  }

  if (pathname !== '/') {
    return NextResponse.next()
  }

  // Allow bots to index the landing page
  const ua = request.headers.get('user-agent') || ''
  if (BOT_UA.test(ua)) {
    return NextResponse.next()
  }

  // Allow unauthenticated users to see the landing page
  const sessionCookie = request.cookies.get('claspire_session')
  if (!sessionCookie) {
    return NextResponse.next()
  }

  // Authenticated users: redirect away from landing page
  return NextResponse.redirect(new URL('/community', request.url))
}

export const config = {
  matcher: ['/', '/api/:path*'],
}
