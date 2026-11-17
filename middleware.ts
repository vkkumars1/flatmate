import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const protectedRoute = ['/discover', '/matches', '/profile', '/admin'].some((route) => request.nextUrl.pathname.startsWith(route))
  if (!protectedRoute) return NextResponse.next()
  return NextResponse.next()
}

export const config = { matcher: ['/discover/:path*', '/matches/:path*', '/profile/:path*', '/admin/:path*'] }
