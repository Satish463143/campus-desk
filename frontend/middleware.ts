// middleware.ts  (root of your project, next to app/)
import { NextRequest, NextResponse } from 'next/server'

// ── Role → allowed route prefixes ─────────────────────────────
const ROLE_ROUTES: Record<string, string[]> = {
  super_admin: [
    '/dashboard',
    '/school-list',
    '/school-details',
    '/settings',
  ],
  principal: [
    '/dashboard',
    '/students',
    '/teachers',
    '/parents',
    '/academic',
    '/timetable',
    '/attendance',
    '/school-members',
    '/fees',
    '/fee-management',
    '/manual-payments',
    '/payment-gateway',
    '/scholarships',
    '/crm',
    '/invoices',
    '/lms',
    '/progress',
    '/notifications',
    '/settings',
  ],
  admin_staff: [
    '/dashboard',
    '/students',
    '/teachers',
    '/parents',
    '/academic',
    '/timetable',
    '/attendance',
    '/admissions',
    '/school-members',
    '/fee-management',
    '/manual-payments',
    '/payment-gateway',
    '/scholarships',
    '/crm',
    '/notifications',
    '/settings',
  ],
  accountant: [
    '/dashboard',
    '/students',
    '/fees',
    '/fee-management',
    '/manual-payments',
    '/payment-gateway',
    '/scholarships',
    '/crm',
    '/invoices',
    '/notifications',
  ],
  teacher: [
    '/dashboard',
    '/timetable',
    '/teacher-attendance',
    '/lms',
    '/progress',
    '/notifications',
  ],
  student: [
    '/dashboard',
    '/timetable',
    '/attendance',
    '/fees',
    '/lms',
    '/exams',
    '/progress',
    '/notifications',
  ],
  parent: [
    '/dashboard',
    '/children',
    '/attendance',
    '/fees',
    '/progress',
    '/notifications',
  ],
}

// ── Public routes — no token needed ───────────────────────────
const PUBLIC_ROUTES = [
    '/',
    '/login',
    '/forgot-password',
]

// ── Auth routes — redirect to dashboard if already logged in ──
const AUTH_ROUTES = [
  '/login',
  '/forgot-password',
]

// ── Role default landing page ──────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  super_admin: '/dashboard',
  principal:   '/dashboard',
  admin_staff: '/dashboard',
  accountant:  '/dashboard',
  teacher:     '/dashboard',
  student:     '/dashboard',
  parent:      '/dashboard',
}

// ─────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Get token and role from cookies
  //    (you will set these cookies on login)
  const token = request.cookies.get('_at')?.value
  const role  = request.cookies.get('_role')?.value

  // 2. Allow public assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 3. If visiting auth route and already logged in → go to dashboard
  if (AUTH_ROUTES.includes(pathname)) {
    if (token && role) {
      const home = ROLE_HOME[role] ?? '/dashboard'
      return NextResponse.redirect(new URL(home, request.url))
    }
    return NextResponse.next()
  }

  // 4. If visiting public route → allow
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next()
  }

  // 5. No token → redirect to login
  if (!token || !role) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname) // remember where they were going
    return NextResponse.redirect(loginUrl)
  }

  // 6. Check role has access to this route
  const allowedPrefixes = ROLE_ROUTES[role] ?? []
  const hasAccess = allowedPrefixes.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (!hasAccess) {
    // Role is valid but not allowed here → go to their home
    const home = ROLE_HOME[role] ?? '/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }

  // 7. All good → continue
  return NextResponse.next()
}

// ── Which routes this middleware runs on ──────────────────────
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}