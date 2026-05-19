import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In Next.js 16, middleware is renamed to "proxy".
// We can't call the NextAuth `auth()` helper here (requires Node.js runtime),
// so we check for the NextAuth session cookie directly.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // NextAuth v5 uses an "authjs.session-token" cookie in production
  // and "__Secure-authjs.session-token" on HTTPS
  const sessionCookie =
    request.cookies.get('authjs.session-token') ??
    request.cookies.get('__Secure-authjs.session-token')

  const isLoggedIn = Boolean(sessionCookie)

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect logged-in users away from login
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
