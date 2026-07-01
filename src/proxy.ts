import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/session'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Never intercept static files, API routes, or Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|eot|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isAdminLogin   = pathname === '/admin/login'
  const isAdminPath    = pathname.startsWith('/admin') && !isAdminLogin
  const isUserAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email']
    .some(p => pathname.startsWith(p))

  const session = await getSessionFromRequest(req)

  // ── Admin login page ──
  if (isAdminLogin) {
    // Already-logged-in admins go to /admin
    if (session?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.next()
  }

  // ── Regular auth pages ──
  if (isUserAuthPage) {
    if (session) {
      // Send authenticated users to the right place
      const redirectTo = session.role === 'ADMIN' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
    return NextResponse.next()
  }

  // ── Protect admin routes ──
  if (isAdminPath) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Public routes (landing page) — no auth required ──
  const isPublicRoute = pathname === '/'
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // ── Protect everything else (main tool + dashboard) ──
  // This covers '/dashboard', etc.
  if (!session) {
    const url = new URL('/login', req.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  if (!session.isActive) {
    return NextResponse.redirect(new URL('/login?error=inactive', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|_next/webpack|favicon\\.ico).*)',
  ],
}
